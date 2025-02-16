package cmd

import (
	"flag"
	"fmt"
	"os"
)

const Version = "0.1.0"

func AsciiArt() {
	fmt.Println(" _   __      _           _")
	fmt.Println("| | / /     | |         (_)")
	fmt.Println("| |/ /  __ _| |_ __ ___  _  __ _")
	fmt.Println("|    \\ / _` | | '_ ` _ \\| |/ _` |")
	fmt.Println("| |\\  \\ (_| | | | | | | | | (_| |")
	fmt.Println("\\_| \\_/\\__,_|_|_| |_| |_|_|\\__,_|")
	fmt.Printf("\t\t            v%s\n", Version)
}

func ParseFlags() string {
	configPath := flag.String("config", "./config.json", "path to config file")
	help := flag.Bool("help", false, "print help and exit")
	version := flag.Bool("version", false, "print version and exit")

	flag.Parse()

	if *version {
		println(Version)
		os.Exit(0)
	}

	if *help {
		flag.Usage()
		os.Exit(0)
	}

	return *configPath
}
