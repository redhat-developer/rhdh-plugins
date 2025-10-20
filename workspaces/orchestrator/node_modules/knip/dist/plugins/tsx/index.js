const title = 'tsx';
const args = {
    positional: true,
    nodeImportArgs: true,
    args: (args) => args.filter(arg => arg !== 'watch'),
};
export default {
    title,
    args,
};
