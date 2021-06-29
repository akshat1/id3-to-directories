# id3-to-directories
A command-line tool to organize a directory of unsorted (but ID3 tagged) music files into "Artist Name/Album Name/Song Title.ext" sub-directory structure under a location specified by an environment variable.

We operate with the assumption that most users are going to have a primary "music directory" on their computer. For instance on linux environments, this will often be `$HOME/Music`. We use this assumption to make the operation of this tool as simple as possible where you have to supply a single argument, the source directory which contains unsorted (but ID3 tagged) files.

I wrote this package over a few minutes while playing with the excellent node-id3 package and as such this tool addresses a limited use-case. But this being a GPLV3 package, feel free to submit PRs or fork the repo to support your own use case.

## Installation

```
npm i -g id3-to-directories
```

## Usage

### Set an environment variable

In your .bashrc (or equivalent) export the variable `MUSIC_STORAGE_DIRECTORY`. For instance,

```sh
export MUSIC_STORAGE_DIRECTORY=/home/adamsmith/Music
```

### Invoke the command

```sh
id3-to-directories /home/adamsmith/Downloads
```

This will cause all the mp3 files present in `/home/adamsmith/Downloads` (and sub-directories) to be moved into corresponding `/home/adamsmith/Music/<artist name>/<album name>/<song title>.<extension>` directories.

## Credits

The real magic of reading ID3 tags is performed by the [node-id3 package](https://github.com/Zazama/node-id3). I only wrote some very simple FS walking logic which uses the said package.
