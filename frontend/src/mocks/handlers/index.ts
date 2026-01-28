import { systemHandlers } from './system';
import { clusterHandlers } from './cluster';
import { collectionsHandlers } from './collections';
import { snapshotsHandlers } from './snapshots';
import { storageHandlers } from './storage';
import { jobsHandlers } from './jobs';

export const handlers = [
  ...systemHandlers,
  ...clusterHandlers,
  ...collectionsHandlers,
  ...snapshotsHandlers,
  ...storageHandlers,
  ...jobsHandlers,
];
