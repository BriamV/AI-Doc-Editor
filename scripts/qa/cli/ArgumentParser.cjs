/**
 * ArgumentParser.cjs - CLI Argument Parsing and Validation
 * Conservative extraction from qa-cli.cjs lines 50-215
 * No new functionality added - exact mapping only
 */

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

class ArgumentParser {
  constructor() {
    this.qaCommand = 'npm run cmd qa'; // Default fallback
  }

  /**
   * Set dynamic QA command for help text
   */
  setQACommand(command) {
    this.qaCommand = command;
  }

  /**
   * Create and configure yargs CLI
   */
  createCLI() {
    return yargs(hideBin(process.argv))
      .scriptName('qa')
      .usage('$0 [options] [task] - Sistema QA CLI para validación automática de código')
      
      // Global options
      .option('fast', {
        type: 'boolean',
        description: 'Modo rápido para pre-commit hooks (<10s)',
        default: false
      })
      .option('scope', {
        type: 'string',
        description: 'Ámbito de validación',
        choices: ['frontend', 'backend', 'infrastructure', 'all']
      })
      .option('dimension', {
        type: 'string',
        description: 'Dimensión de calidad específica',
        choices: ['format', 'lint', 'test', 'security', 'build', 'all']
      })
      .option('dod', {
        type: 'string',
        description: 'Validar Definition of Done específico',
        choices: ['code-review', 'integration', 'performance', 'security', 'documentation']
      })
      .option('config', {
        type: 'string',
        description: 'Archivo de configuración personalizado',
        default: 'qa-config.json'
      })
      .option('verbose', {
        type: 'boolean',
        description: 'Salida detallada',
        default: false
      })
      .option('report', {
        type: 'string',
        description: 'Generar reporte en formato específico',
        choices: ['json', 'html', 'console', 'ci-json']
      })
      .option('report-issue', {
        type: 'boolean',
        description: 'Abrir formulario para reportar problema (RF-008)',
        default: false
      })
      
      // Default command (no subcommand)
      .command(
        '$0 [task]',
        'Ejecutar validación QA automática',
        (yargs) => {
          yargs.positional('task', {
            describe: 'Tarea específica (T-XX) o etiqueta DoD',
            type: 'string'
          });
        }
      )
      
      // Report issue command (RF-008)
      .command(
        'report-issue',
        'Reportar problema con el sistema QA (RF-008)',
        (yargs) => {
          yargs
            .option('tool', {
              type: 'string',
              description: 'Herramienta que causó el problema'
            })
            .option('error', {
              type: 'string',
              description: 'Mensaje de error específico'
            })
            .option('context', {
              type: 'string',
              description: 'Contexto adicional del problema'
            });
        }
      )
      
      // List issues command (RF-008 extension)
      .command(
        'list-issues',
        'Listar reportes de issues locales',
        (yargs) => {
          yargs
            .option('limit', {
              type: 'number',
              description: 'Número máximo de issues a mostrar',
              default: 10
            })
            .option('status', {
              type: 'string',
              description: 'Filtrar por estado (open, closed, all)',
              choices: ['open', 'closed', 'all'],
              default: 'open'
            });
        }
      )
      
      // Help command
      .command(
        'help [command]',
        'Mostrar ayuda detallada',
        (yargs) => {
          yargs.positional('command', {
            describe: 'Comando específico para mostrar ayuda',
            type: 'string'
          });
        }
      )
      
      // Examples
      .example('$0', 'Ejecutar validación automática basada en contexto')
      .example('$0 --fast', 'Modo rápido para pre-commit hooks')
      .example('$0 --scope frontend', 'Validar solo el frontend')
      .example('$0 --dimension lint', 'Ejecutar solo linting')
      .example('$0 T-02', 'Validar tarea específica T-02')
      .example('$0 --scope backend --dimension test', 'Ejecutar tests del backend')
      .example('$0 --report ci-json', 'Generar reporte JSON para CI/CD')
      .example('$0 report-issue', 'Reportar problema con el sistema QA')
      .example('$0 list-issues', 'Listar reportes de issues locales')
      .example('$0 --report-issue', 'Activar reporte de problema tras fallo')
      
      // Configuration
      .help('h')
      .alias('h', 'help')
      .wrap(Math.min(120, process.stdout.columns))
      .strict()
      .check((argv) => {
        // Validar flags conocidos para better error messages
        const validFlags = ['fast', 'scope', 'dimension', 'dod', 'config', 'verbose', 'report', 'report-issue', 'reportIssue', 'help', 'h', 'version'];
        const invalidFlags = Object.keys(argv).filter(key => 
          key.length > 1 && key !== '_' && key !== '$0' && !validFlags.includes(key)
        );
        if (invalidFlags.length > 0) {
          throw new Error(`Unknown flag(s): ${invalidFlags.map(f => '--' + f).join(', ')}\nUse --help to see available options.`);
        }
        return true;
      })
      .demandCommand(0, 1);
  }

  /**
   * Parse arguments and validate
   */
  parseArguments() {
    const cli = this.createCLI();
    return cli.argv;
  }
}

module.exports = ArgumentParser;