window.onerror = (err) => {
    console.log(`An error occured. More info: ${err}`); // TODO: replace console.log() with debug
    throw err;
};

window.onunhandledrejection = (err) => {
    console.log(`Unhandled rejection. More info: ${err}`);
    throw err;
};