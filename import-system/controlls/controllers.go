package system

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"git.difuse.io/Difuse/kalmia/db/models"
	"git.difuse.io/Difuse/kalmia/import-system/utils"
	"git.difuse.io/Difuse/kalmia/services"
)

const (
	UploadFile_Dir = "import-system/uploads/file_dir"
	UploadDoc_Dir  = "import-system/uploads/doc_dir"
	FilePermission = 0755
)

// Create a user object (static for now)
var User = models.User{
	ID:       2,
	Admin:    false,
	Username: "user",
	Email:    "user@example.com",
}

var (
	// pageGroup_id uint
	// parent_id    uint
	doc_Id       uint = 4
	pageGroup_id uint = 0
)

func ImportedMDFileController(services *services.ServiceRegistry, filename string, file multipart.File) error {
	fileDestPath := filepath.Join(UploadFile_Dir, filename)

	destFile, err := os.Create(fileDestPath)
	if err != nil {
		return fmt.Errorf("could not create destination file: %w", err)
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, file)
	if err != nil {
		return fmt.Errorf("could not save file: %w", err)
	}

	_, err = ParsingAndCreatingMDFile(services, fileDestPath, filename, 0)
	if err != nil {
		return fmt.Errorf("failed to create the file: %w", err)
	}
	defer CleanDirectory(UploadFile_Dir)
	return nil
}

func Content_to_Block_to_JsonString(fileDestPath string) (string, error) {
	content, err := ioutil.ReadFile(fileDestPath)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}
	blocks, err := utils.ParseMarkDownToBlocks(string(content))
	if err != nil {
		return "", fmt.Errorf("failed to parse markdown content: %w", err)
	}
	// Convert blocks to JSON
	jsonString, err := json.MarshalIndent(blocks, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to generate JSON: %w", err)
	}
	return string(jsonString), nil
}

func ParsingAndCreatingMDFile(services *services.ServiceRegistry, fileDestPath string, filename string, pageGroup_id uint) (uint, error) {

	jsonString, err := Content_to_Block_to_JsonString(fileDestPath)
	if err != nil {
		return 0, fmt.Errorf("operation failed: %w", err)
	}
	pageMeta := models.Page{
		AuthorID:        User.ID,
		Author:          User,
		DocumentationID: 4,
		Title:           utils.TitleCreater(filename),
		Content:         jsonString,
		Slug:            utils.GenerateSlug(),
		Editors:         []models.User{User},
		IsIntroPage:     false,
		IsPage:          true,
	}
	if pageGroup_id != 0 {
		pageMeta.PageGroupID = &pageGroup_id
	}
	err = services.DocService.CreatePage(&pageMeta)
	if err != nil {
		return 0, fmt.Errorf("failed to create the page: %w", err)
	}
	return pageMeta.DocumentationID, nil
}

func ImportedDocumentationController(services *services.ServiceRegistry, filename string, file multipart.File) error {
	if filename == "" || file == nil {
		return fmt.Errorf("invalid file input")
	}

	if err := os.MkdirAll(UploadDoc_Dir, FilePermission); err != nil {
		return fmt.Errorf("could not create extraction directory: %w", err)
	}

	zipFilePath := filepath.Join(UploadDoc_Dir, filename)
	destFile, err := os.Create(zipFilePath)
	if err != nil {
		return fmt.Errorf("could not create destination file: %w", err)
	}
	defer func() {
		destFile.Close()
		os.Remove(zipFilePath)
	}()

	if _, err := io.Copy(destFile, file); err != nil {
		return fmt.Errorf("could not save file: %w", err)
	}

	// Extract the zip file into a directory named after the zip file
	extractDirPath := strings.TrimSuffix(zipFilePath, filepath.Ext(zipFilePath))
	extracted, err := ExtractZipFile(zipFilePath, UploadDoc_Dir)
	if err != nil {
		return fmt.Errorf("unable to extract zip file: %w", err)
	}

	// Call DocumentationUploader with the extracted directory
	if extracted {
		err := DocumentationUploader(services, extractDirPath, doc_Id, pageGroup_id)
		if err != nil {
			return fmt.Errorf("uploading failed: %w", err)
		}
	}

	return nil
}

func ExtractZipFile(zipFilePath string, extractionLocation string) (bool, error) {
	zipReader, err := zip.OpenReader(zipFilePath)
	if err != nil {
		return false, fmt.Errorf("failed to open zip file: %w", err)
	}
	defer zipReader.Close()

	for _, file := range zipReader.File {
		filePath := filepath.Join(extractionLocation, file.Name)

		// Prevent path traversal attacks
		cleanPath := filepath.Clean(extractionLocation)

		if !filepath.HasPrefix(filePath, cleanPath+string(os.PathSeparator)) {
			return false, fmt.Errorf("illegal file path: %s", filePath)
		}

		// Handle directories
		if file.FileInfo().IsDir() {
			if err := os.MkdirAll(filePath, FilePermission); err != nil {
				return false, fmt.Errorf("failed to create directory: %w", err)
			}
			continue
		}
		if err := extractFile(file, filePath); err != nil {
			return false, err
		}
	}
	return true, nil
}

func extractFile(file *zip.File, filePath string) error {

	outFile, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, file.Mode())
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	defer outFile.Close()

	rc, err := file.Open()
	if err != nil {
		return fmt.Errorf("failed to open zip file content: %w", err)
	}
	defer rc.Close()
	if _, err := io.Copy(outFile, rc); err != nil {
		return fmt.Errorf("failed to copy file content: %w", err)
	}

	return nil
}

func DocumentationUploader(services *services.ServiceRegistry, extractDirPath string, doc_Id uint, pagegroup_id uint) error {
	return ProcessDirectory(services, extractDirPath, doc_Id, pagegroup_id)
}

// ****** Recursively calling when nested directory hits ******//
func ProcessDirectory(services *services.ServiceRegistry, extractDirPath string, doc_Id uint, PageGroupID uint) error {
	entries, err := os.ReadDir(extractDirPath) // Read directory entries
	if err != nil {
		return fmt.Errorf("error reading directory %s: %w", extractDirPath, err)
	}

	for _, entry := range entries {
		entryPath := filepath.Join(extractDirPath, entry.Name())
		if entry.IsDir() {
			entryPath := filepath.Join(extractDirPath, entry.Name())
			PageGroupID, err := CreatNestedPageGroup(services, doc_Id, entry.Name())
			if err != nil {
				return fmt.Errorf("error: %w", err)
			}
			err = ProcessDirectory(services, entryPath, doc_Id, PageGroupID)
			if err != nil {
				return fmt.Errorf("error processing subdirectory %s: %w", entryPath, err)
			}
		} else {
			if !strings.HasSuffix(entry.Name(), ".zip") {
				_, err := ParsingAndCreatingMDFile(services, entryPath, entry.Name(), PageGroupID)
				if err != nil {
					return fmt.Errorf("error processing file %s: %w", entryPath, err)
				}
				fmt.Printf("File processed: %s\n", entry.Name())
			}
		}
	}

	defer CleanDirectory(UploadDoc_Dir)

	return nil
}

func CreatNestedPageGroup(services *services.ServiceRegistry, doc_id uint, pageGroupName string) (uint, error) {
	pageGroupMeta := models.PageGroup{
		Name:            pageGroupName,
		DocumentationID: doc_Id,
		AuthorID:        User.ID,
		Author:          User,
		Editors:         []models.User{User},
		LastEditorID:    &User.ID,
	}

	// Create the page group
	pageGroup_id, err := services.DocService.CreatePageGroup(&pageGroupMeta)
	if err != nil {
		return 0, fmt.Errorf("failed to create page group for directory %w", err)
	}
	return pageGroup_id, nil
}

// cleaning '/uploads' directory after creation
func CleanDirectory(dir string) {
	d, err := os.Open(dir)
	if err != nil {
		log.Printf("cleaning process failed %v", err)
		return
	}
	defer d.Close()
	names, err := d.Readdirnames(-1)
	if err != nil {
		log.Printf("cleaning process failed %v", err)
		return
	}
	for _, name := range names {
		err = os.RemoveAll(filepath.Join(dir, name))
		if err != nil {
			log.Printf("cleaning process failed %v", err)
			return
		}
	}
	log.Printf("Directory:%s cleaned successfully removed", dir)
}
