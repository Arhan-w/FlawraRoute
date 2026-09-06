export function registerProvider(program) {
  program
    .command("provider [subcommand]")
    .description("Manage provider connections (use 'providers' for the full interface)")
    .allowUnknownOption()
    .allowExcessArguments()
    .action(() => {
      console.log(`
  Use \`flawraroute providers\` for the full provider management interface:

    flawraroute providers available   — show provider catalog
    flawraroute providers list        — list configured connections
    flawraroute providers test <name> — test a provider connection
    flawraroute providers test-all    — test all active connections
    flawraroute providers validate    — validate local configuration
    flawraroute providers add <id>    — add an API-key connection
    flawraroute providers auth <id>   — start an existing OAuth flow
    flawraroute providers remove <id> — remove a connection (requires confirmation)
`);
    });
}
