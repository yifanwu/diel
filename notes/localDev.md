# Local Dev Notes

Had some major struggles with npm install local files --- it turns out that npm does a symlink when `npm install <path-to-local>` and that will brute link everything, as opposed to emulating the real publication. To achieve the latter, we should do the following:

```bash
npm pack <path-to-local-package>
npm install <package-version.tgz>
```

There also seemed to be some oddities with update --- the files were not synced properly; I had to uninstall and reinstall again... 

## Best practices

Try to call the direct functions as much as possible --- avoids the type casting, but it's not always the cleanest design since sometimes we might want to overload.

Hmm there are now a lot of coupling with the grammar, which will hopefully stablize soon...