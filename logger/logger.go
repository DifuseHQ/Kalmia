package logger

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var Logger *zap.Logger

func InitializeLogger(env string, logLevel string, dataPath string) {
	logsPath := filepath.Join(dataPath, "logs")
	if _, err := os.Stat(logsPath); os.IsNotExist(err) {
		if err = os.MkdirAll(logsPath, 0755); err != nil {
			panic(fmt.Errorf("failed to create log directory: %v", err))
		}
	}

	var config zap.Config
	if env == "production" || env == "prod" {
		config = zap.NewProductionConfig()
	} else {
		config = zap.NewDevelopmentConfig()
	}

	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	config.EncoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder
	config.EncoderConfig.EncodeDuration = zapcore.StringDurationEncoder
	config.EncoderConfig.EncodeCaller = zapcore.ShortCallerEncoder
	config.EncoderConfig.ConsoleSeparator = " "

	var logFileName string

	if env == "test" {
		logFileName = filepath.Join(logsPath, time.Now().Format("2006-01-02")+".test"+".log")
	} else {
		logFileName = filepath.Join(logsPath, time.Now().Format("2006-01-02")+".log")
	}

	config.OutputPaths = []string{"stdout", logFileName}
	config.ErrorOutputPaths = []string{"stderr", logFileName}

	switch logLevel {
	case "debug":
		config.Level = zap.NewAtomicLevelAt(zapcore.DebugLevel)
	case "info":
		config.Level = zap.NewAtomicLevelAt(zapcore.InfoLevel)
	case "warn":
		config.Level = zap.NewAtomicLevelAt(zapcore.WarnLevel)
	case "error":
		config.Level = zap.NewAtomicLevelAt(zapcore.ErrorLevel)
	default:
		config.Level = zap.NewAtomicLevelAt(zapcore.InfoLevel)
		Logger.Warn("Invalid log level, defaulting to info.")
	}

	var err error
	Logger, err = config.Build(zap.AddCallerSkip(1), zap.AddStacktrace(zapcore.ErrorLevel))
	if err != nil {
		panic(fmt.Errorf("failed to initialize logger: %v", err))
	}
}

func Info(msg string, fields ...zap.Field) {
	Logger.Info(msg, fields...)
}

func Debug(msg string, fields ...zap.Field) {
	Logger.Debug(msg, fields...)
}

func Warn(msg string, fields ...zap.Field) {
	Logger.Warn(msg, fields...)
}

func Error(msg string, fields ...zap.Field) {
	Logger.Error(msg, fields...)
}

func Fatal(msg string, fields ...zap.Field) {
	Logger.Fatal(msg, fields...)
}

func Panic(msg string, fields ...zap.Field) {
	Logger.Panic(msg, fields...)
}
