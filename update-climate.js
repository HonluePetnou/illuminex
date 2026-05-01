const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\SUPRA STORES\\Documents\\illuminex\\illuminex-bj\\my-app\\src\\data\\climate';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

files.forEach(file => {
  const p = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  
  let baseTemp = 28;
  if (file.includes('desert')) baseTemp = 35;
  else if (file.includes('sahel')) baseTemp = 32;
  else if (file.includes('mediterraneen')) baseTemp = 24;
  else if (file.includes('equatorial')) baseTemp = 27;

  let totalT2M = 0;
  let countT2M = 0;

  for (const month in data.data) {
    for (const hour in data.data[month]) {
      const entry = data.data[month][hour];
      entry.f = parseFloat((entry.ALLSKY / (entry.CLRSKY || 1)).toFixed(2));
      if (entry.f > 1) entry.f = 1;
      
      const h = parseInt(hour);
      // T2M peaks around 14h
      entry.T2M = parseFloat((baseTemp + Math.sin((h - 8) / 12 * Math.PI) * 4).toFixed(1));
      entry.WS10M = parseFloat((3 + Math.random() * 2).toFixed(1));
      
      totalT2M += entry.T2M;
      countT2M++;
    }
  }
  
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
  console.log(`Updated ${file}`);
});
