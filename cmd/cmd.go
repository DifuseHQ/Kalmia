package cmd

import (
	"flag"
	"fmt"
	"os"
)

const Version = "0.2.0"

func AsciiArt() {
	fmt.Println(" _   __      _           _")
	fmt.Println("| | / /     | |         (_)")
	fmt.Println("| |/ /  __ _| |_ __ ___  _  __ _")
	fmt.Println("|    \\ / _` | | '_ ` _ \\| |/ _` |")
	fmt.Println("| |\\  \\ (_| | | | | | | | | (_| |")
	fmt.Println("\\_| \\_/\\__,_|_|_| |_| |_|_|\\__,_|")
	fmt.Printf("\t\t            v%s\n", Version)
}

func ParseFlags() (configPath string, clearEphemeral bool) {
	configPathPtr := flag.String("config", "./config.json", "path to config file")
	help := flag.Bool("help", false, "print help and exit")
	version := flag.Bool("version", false, "print version and exit")
	clearEphemeralPtr := flag.Bool("clear-ephemeral-dir", false, "remove ephemeral build/cache directories")

	flag.Parse()

	if *version {
		println(Version)
		os.Exit(0)
	}

	if *help {
		flag.Usage()
		os.Exit(0)
	}

	return *configPathPtr, *clearEphemeralPtr
}
