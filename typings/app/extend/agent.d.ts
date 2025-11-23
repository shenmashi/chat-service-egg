// This file is created by egg-ts-helper@1.35.2
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExtendAgent from '../../../app/extend/agent';
type ExtendAgentType = typeof ExtendAgent;
declare module 'egg' {
  interface Agent extends ExtendAgentType { }
}