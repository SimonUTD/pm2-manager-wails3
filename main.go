package main

import (
	"embed"
	_ "embed"
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create a new Wails application
	app := application.New(application.Options{
		Name:        "PM2 Manager",
		Description: "A desktop PM2 process manager built with Wails v3",
		Services: []application.Service{
			application.NewService(&PM2Service{}),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	// Create the main window
	app.NewWebviewWindowWithOptions(application.WebviewWindowOptions{
		Title:  "PM2 Manager",
                Width:  1200,
                Height: 800,
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGB(255, 255, 255),
		URL:              "/",
	})

	// Run the application
	err := app.Run()
	if err != nil {
		log.Fatal(err)
	}
}
