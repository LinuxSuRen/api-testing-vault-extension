package cmd

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestNewRootCmd(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.TODO(), time.Second)
	defer cancel()

	cmd := NewRootCmd()
	cmd.SetContext(ctx)
	cmd.SetArgs([]string{"--port", "0"})
	err := cmd.Execute()
	assert.NoError(t, err)
	assert.Equal(t, "atest-vault-ext", cmd.Use)
}
