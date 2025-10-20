import { statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import yaml from 'js-yaml';
import { parse as parseTOML } from 'smol-toml';
import stripJsonComments from 'strip-json-comments';
import { LoaderError } from './errors.js';
import { join } from './path.js';
export const isDirectory = (filePath) => {
    try {
        return statSync(filePath).isDirectory();
    }
    catch (_error) {
        return false;
    }
};
export const isFile = (filePath) => {
    try {
        return statSync(filePath).isFile();
    }
    catch (_error) {
        return false;
    }
};
export const findFile = (workingDir, fileName) => {
    const filePath = join(workingDir, fileName);
    return isFile(filePath) ? filePath : undefined;
};
export const loadFile = async (filePath) => {
    try {
        const contents = await readFile(filePath);
        return contents.toString();
    }
    catch (error) {
        throw new LoaderError(`Error loading ${filePath}`, { cause: error });
    }
};
export const loadJSON = async (filePath) => {
    const contents = await loadFile(filePath);
    return parseJSON(filePath, contents);
};
export const loadYAML = async (filePath) => {
    const contents = await loadFile(filePath);
    return parseYAML(contents);
};
export const loadTOML = async (filePath) => {
    const contents = await loadFile(filePath);
    return parseTOML(contents);
};
export const parseJSON = async (filePath, contents) => {
    try {
        return JSON.parse(stripJsonComments(contents, { trailingCommas: true }));
    }
    catch (error) {
        throw new LoaderError(`Error parsing ${filePath}`, { cause: error });
    }
};
export const parseYAML = (contents) => {
    return yaml.load(contents);
};
