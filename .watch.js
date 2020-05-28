const fs = require('fs');
const { execFile } = require('child_process');

fs.watchFile('/dool/lucky-lottery/style.less', (curr, prev) => {
  execFile('/dool/lucky-lottery/convert_css.sh', (error, stdout, stderr) => {
    if (error) {
      throw error;
    }
    console.log(`${new Date().toLocaleString()}: convert .less to .css successfully`)
  });
});