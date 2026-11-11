# Moving to a new GitHub repository

The English project will become the first commit in a new empty repository owned
by the other GitHub account. The existing repository and its history stay intact.

1. Create the new empty repository under the other GitHub account without an
   automatically generated README, license or .gitignore.
2. Using the new owner's account, import the English source snapshot into a fresh
   checkout, create one initial commit, and push it to the main branch.
3. Add the GitHub account connected to this development chat as a collaborator
   with write access and accept the invitation. Allow the GitHub integration to
   access the new repository.
4. Provide the new repository URL in the development chat so work can continue
   from that repository through the collaborator account.

Export the source snapshot from the current repository with:

```sh
git archive --format=zip --output=/tmp/cafe-berlin-english-source.zip HEAD
```

For example, after cloning the new empty repository as its owner, extract the
snapshot into the checkout and run:

```sh
git add .
git commit -m "Initial commit: Cafe Berlin app"
git push -u origin main
```

The archive contains the committed English source, migrations, documentation,
screenshots and APK. It excludes Git history, node_modules, local configuration,
private credentials and signing keys. The `.env.example` template is included.

The Supabase project stays the same. Configure `.env.local` in the new checkout
with the existing public project URL and anon key, or run `npm run setup:backend`
using the environment's management credentials. Preserve the existing Android
debug signing key outside Git if future APKs should update this installation.

No migration or remote switch is performed until the new repository is available.
