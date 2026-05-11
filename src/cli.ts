#!/usr/bin/env node

import { Command } from 'commander';
import { registerDoctorCommand } from './commands/doctor.js';
import { registerExportCommand } from './commands/export.js';
import { registerInitCommand } from './commands/init.js';
import { registerListCommand } from './commands/list.js';
import { registerRecordCommand } from './commands/record.js';
import { registerRemoveCommand } from './commands/remove.js';
import { registerRunCommand } from './commands/run.js';
import { registerScheduleCommand } from './commands/schedule.js';

const program = new Command();

program
  .name('clickcron')
  .description('ClickCron CLI for recording, scheduling, and running browser checks.')
  .version('0.1.0');

registerInitCommand(program);
registerRecordCommand(program);
registerRunCommand(program);
registerListCommand(program);
registerScheduleCommand(program);
registerDoctorCommand(program);
registerRemoveCommand(program);
registerExportCommand(program);

program.parse();
