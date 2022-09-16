+++
category = []
date = 2022-09-15T00:00:00Z
description = "git troubleshooting with helpful commands to revert, stash, split, recover commits"
draft = true
showtoc = false
slug = "/tutorial/git/git-troubleshooting-with-helpful-commands"
summary = "Git troubleshooting with helpful commands to revert, stash, split, recover commits"
title = "Git troubleshooting : 6 helpful command with explanations"
[cover]
alt = "git"
caption = "git "
image = ""
relative = false

+++
While commiting in git we sometimes face some issues after commiting or pushing commits to remote repository. Some of the common scenairos are like

1. Commit needs to be reverted before push
2. Commit needs to be reverted after push
3. Switch branch and save current uncommited work
4. Splitting a large commit into smaller understandable commit
5. Recovering lost file
6. Commit in the wrong branch

In these above mentioned case we can do something to fix.

### Commit needs to be reverted before push

* To only undo the last commit command but keep the work

```git
 git reset --soft HEAD~1
```

* Or, revert your work and undo the last commit as well

```
git reset --hard HEAD~1
```

### Commit needs to be reverted after push

* To undo the last commit which is already pushed on the remote branch

```git
git revert HEAD~1
```

* To undo any commit pass the commit hash id

```git
git revert <commit-hash-id>
```

### Switch branch and save current uncommited work

* To only stash a selected file

`git stash push -m "stash-message" <file-path> - "-m stash-message"`

is optional in the above command, it stands for message and adds more description to your stash

### Splitting a large commit into smaller understandable commit

* If by mistake you added all files in a single commit and want to split into multiple commits then use:

`git rebase HEAD~`

* Now, as usual, choose each file and commit them individually

### Recover lost file

* To recover any accidentally deleted files

`git restore -- <file-path>`

This will also get you those files which are even removed from recycle bin

### Commit in the wrong branch

* Suppose you committed last two commits in "master" instead of "feature" branch
* Perform the following series of commands (currently you're on master)

```git reset HEAD~2
git stash
git checkout feature
git stash pop
```