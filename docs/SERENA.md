# Serena MCP

Use Serena MCP for code analysis, search files, search symbols, file operations, and project understanding:

```bash
# File operations
serena_read_file --relative-path [PATH]
serena_create_text_file --relative-path [PATH] --content [CONTENT]

# Code analysis
serena_find_symbol --name-path [SYMBOL_PATH]
serena_get_symbols_overview --relative-path [PATH]
serena_search_for_pattern --substring-pattern [PATTERN]

# Code modifications
serena_replace_symbol_body --name-path [SYMBOL] --relative-path [PATH] --body [NEW_BODY]
serena_insert_after_symbol --name-path [SYMBOL] --relative-path [PATH] --body [CONTENT]

# Memory management
serena_write_memory --memory-name [NAME] --content [CONTENT]
serena_read_memory --memory-file-name [NAME]

# Shell commands
serena_execute_shell_command --command [COMMAND]
```
