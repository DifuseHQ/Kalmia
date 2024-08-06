package embedded

import "embed"

//go:embed docusaurus
var DocusaurusFS embed.FS

//go:embed rspress
var RspressFS embed.FS
