# API key privacy

The key-privacy change keeps provider configuration on the server and removes
plaintext key rendering from the workspace's key-creation dialog.

## Workspace integration keys

Only authorized organization administrators can mount the key-management panel.
Ordinary roles do not see its workspace-tools entry. The existing server-side
organization, role, subscription and key-owner checks remain the security boundary.

A newly created workspace key is available once to its authorized creator, via
an explicit **Copy key** action. It is never assigned to a DOM text node, input
value, hidden field or data attribute. It is not persisted in browser storage.
The transient copy is dropped after copying, dismissal, navigation/unmount,
a workspace change, a tab visibility change, pagehide, or 60 seconds.

This is display privacy, not concealment from the key's authorized owner. The
creation response necessarily delivers the new integration key to that owner;
browser developer tools can inspect that response. Provider secrets are not
returned by this operation. No existing keys are revoked or rotated.

## Provider and build protections

Provider bindings remain server-side. No provider credential values belong in
source control, handoff files, browser bundles or public environment prefixes.
The client build guard is installed in both the application and Pages configs.
It rejects server credential modules in browser chunks, recognized private-key
formats, privileged Supabase JWTs, exposed server environment values, private
files, source maps and public-directory symlinks. It also checks public-prefixed
variables, including values from Vite's loaded environment files.

Error messages report rule names, not values or code excerpts. Publishable keys
are not private credentials; the guard permits known public configuration but
rejects a secret key disguised under a publishable name. Provider key formats
can change: these checks supplement, not replace, server-side authorization,
secret management, Git-history scanning and appropriate key rotation after a
confirmed leak. They do not prove the absence of every possible secret.

## Deployment

GitHub Pages deploys only the public marketing preview. Updating or merging this
change does not publish the Sites-hosted backend at quevian.com. The existing
hosting project must deploy the same tested revision, preserving all real
bindings, before its authenticated screens receive these changes. No DNS,
provider billing, customer records, backups or retention settings are changed.
