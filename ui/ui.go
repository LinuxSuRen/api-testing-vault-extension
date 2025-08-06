package ui

import (
	_ "embed"
)

//go:embed dist/atest-vault-ui.umd.js
var js string

//go:embed dist/atest-vault-ui.css
var css string

func GetJS() string {
	return js
}

func GetCSS() string {
	return css
}
