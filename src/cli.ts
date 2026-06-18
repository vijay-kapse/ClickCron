#!/usr/bin/env node

import { Command } from 'commander';
import { registerDoctorCommand } from './commands/doctor.js';
import { registerExportCommand } from './commands/export.js';
import { registerHealCommand } from './commands/heal.js';
import { registerInitCommand } from './commands/init.js';
import { registerListCommand } from './commands/list.js';
import { registerRecordCommand } from './commands/record.js';
import { registerRemoveCommand } from './commands/remove.js';
import { registerRunCommand } from './commands/run.js';
import { registerScheduleCommand } from './commands/schedule.js';

const program = new Command();

program
  .name('clickcron')
  .description('Record browser clicks once, run them forever as AI self-healing, scheduled checks.')
  .version('0.2.0');

registerInitCommand(program);
registerRecordCommand(program);
registerRunCommand(program);
registerHealCommand(program);
registerListCommand(program);
registerScheduleCommand(program);
registerDoctorCommand(program);
registerRemoveCommand(program);
registerExportCommand(program);

program.parse();
