#! /usr/bin/env node
'use strict';
const { promises: fs } = require('fs');
const path = require('path');
const { Promise: NodeID3 } = require('node-id3');

const srcDir = process.argv[2];
const targetDirectory = process.env.MUSIC_STORAGE_DIRECTORY;

const unsafe = ['$RECYCLE.BIN'];
const isSafe = (root, entry) => unsafe.indexOf(entry.name) === -1;

/*
 * Get a flat-list of fs.Dirent objects. Each such object is augmented with the full path to simplify things later.
 */
const getFiles = async (root) => {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = [];
  for (let entry of entries) {
    if (isSafe(root, entry)) {
      if (entry.isFile()) {
        entry.filePath = path.join(root, entry.name);
        files.push(entry);
      } else if (entry.isDirectory()) {
        files.push(...await getFiles(path.join(root, entry.name)));
      }
    }
  }

  return files;
};

const printUsage = () => {
  const usage = [
    'id3-to-directories',
    'A tool to organize a directory of unsorted (but ID3 tagged) music files into "$MUSIC_STORAGE_DIRECTORY/Artist Name/Album Name/Song Title.ext" directory structure.',
    '  where MUSIC_STORAGE_DIRECTORY is an environment variable.',
    '\n',
    'Usage:',
    '  id3-to-directories SrcDirectoryPath',
    'e.g.',
    '  # The following case where all mp3 files in ~/Downloads will be moved to the right sub-directories under /home/adamsmith/Music',
    '  in your .bashrc (or .zshrc)',
    '  export MUSIC_STORAGE_DIRECTORY=/home/adamsmith/Music',
    '  id3-to-directories ~/Downloads',
    new Array(20).fill('-').join(''),
  ].join('\n');
  console.log(usage);
}

const main = async () => {
  try {
    // Check pre-reqs
    if (!srcDir) {
      throw new Error('Missing srcDir.');
    };

    if (!targetDirectory) {
      throw new Error('Missing MUSIC_STORAGE_DIRECTORY environment variable.');
    }

    const srcDirEntry = await fs.stat(srcDir);
    if (!srcDirEntry.isDirectory()) {
      throw new Error(`${srcdir} is not a directory.`);
    }

    const targetDirEntry = await fs.stat(targetDirectory);
    if (!targetDirEntry.isDirectory()) {
      throw new Error(`${targetDirEntry} is not a directory.`);
    }
  } catch (error) {
    printUsage();
    console.error(error);
    process.exit(1);
  }

  // Get list of files.
  console.log(`Resursively scanning ${srcDir} to get list of files...`);
  const fileEntries = await getFiles(srcDir);
  console.log(`${fileEntries.length} files found.`);
  if (fileEntries.length) {
    console.log('Reading ID3 tags...');
    // Organize as Artist { Album { Title }}
    const byArtist = {};
    for (let fileEntry of fileEntries) {
      const { filePath } = fileEntry;
      const tags = await NodeID3.read(filePath);
      const {
        artist = "Unknown Artist",
        album = "Unknown Album",
        title = path.basename(filePath, path.extname(filePath)),
      } = tags;

      let byAlbum = byArtist[artist];
      if (!byAlbum) {
        byAlbum = byArtist[artist] = {};
      }

      let albumSongs = byAlbum[album];
      if (!albumSongs) {
        albumSongs = byAlbum[album] = {};
      }

      albumSongs[title] = fileEntry;
    }

    console.log('Done reading ID3. Moving files...');
    const errors = [];
    // Move files to the right directory
    for (let artist in byArtist) {
      for (let album in byArtist[artist]) {
        for (let title in byArtist[artist][album]) {
          const { filePath } = byArtist[artist][album][title];
          const finalTargetDirectory = path.join(targetDirectory, artist, album);
          const targetFilePath = `${path.join(finalTargetDirectory, title)}${path.extname(filePath)}`;
          if (targetFilePath !== filePath) {
            try {
              console.log(`mkdir ${finalTargetDirectory}`);
              await fs.mkdir(finalTargetDirectory, { recursive: true });
              console.log(`mv ${filePath} ${targetFilePath}`);
              await fs.rename(filePath, targetFilePath);
            } catch (error) {
              errors.push(`${filePath}: ${error.message}`);
            }
          }
        }
      }
    }

    console.log('All done.');
    if (errors.length) {
      console.log('The following errors occurred:');
      console.log(errors.join('\n'));
    }
  } else {
    console.log('Nothing to do.');
  }
};

main();
