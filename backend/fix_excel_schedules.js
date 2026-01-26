const fs = require('fs');
const path = require('path');

const excelData = JSON.parse(fs.readFileSync('excel_dump.json', 'utf8'));
const usersRaw = JSON.parse(fs.readFileSync('users_db.json', 'utf8'));
const teachers = usersRaw.filter(u => u.role === 'TEACHER');

function findCorrectEmail(oldEmail) {
    if (!oldEmail) return oldEmail;
    const oldPrefix = oldEmail.split('@')[0].toLowerCase();

    // 1. Exact match (case insensitive)
    const exact = teachers.find(t => t.email.toLowerCase() === oldEmail.toLowerCase());
    if (exact) return exact.email;

    // 2. Prefix match (oldPrefix + '.' matches start of newPrefix)
    // Most old are: firstname.lastname
    // Most new are: firstname.lastname.titles
    const prefixMatch = teachers.find(t => {
        const newEmail = t.email.toLowerCase();
        const newPrefix = newEmail.split('@')[0];
        // Handle cases like "adisasmito" vs "adi.sasmito"
        if (oldPrefix === 'adisasmito' && newPrefix.startsWith('adi.sasmito')) return true;
        if (newPrefix.startsWith(oldPrefix + '.')) return true;
        if (newPrefix.startsWith(oldPrefix + '_')) return true;
        return false;
    });
    if (prefixMatch) return prefixMatch.email;

    // 3. Fallback: manual specific mappings for ones that don't follow the pattern
    const manuals = {
        'ahmad.mursyid@sekolah.com': 'mursid@sekolah.com', // Guessing based on common patterns
        'pramatagi@sekolah.com': 'pramatagi.flosyandini.s.pd@sekolah.com',
        'astutik.hartina@sekolah.com': 'astutik.hartina.s.pd@sekolah.com',
        'silvia.dwi@sekolah.com': 'silvia.dwi.a.n.s.pd@sekolah.com'
    };

    // If we have a manual mapping
    if (manuals[oldEmail.toLowerCase()]) {
        const manualEmail = manuals[oldEmail.toLowerCase()];
        if (teachers.find(t => t.email.toLowerCase() === manualEmail.toLowerCase())) {
            return manualEmail;
        }
    }

    // 4. Case: name is in the middle of a longer name or similar
    const closeMatch = teachers.find(t => {
        const newPrefix = t.email.toLowerCase().split('@')[0];
        // If the old name is contained within the new name completely
        const cleanOldPrefix = oldPrefix.replace(/[^a-z]/g, '');
        const cleanNewPrefix = newPrefix.replace(/[^a-z]/g, '');
        return cleanNewPrefix.includes(cleanOldPrefix);
    });

    return closeMatch ? closeMatch.email : oldEmail;
}

const fixedData = excelData.map(row => {
    const newEmail = findCorrectEmail(row.TeacherEmail);
    return {
        ...row,
        TeacherEmail: newEmail
    };
});

// Convert to CSV
const headers = Object.keys(fixedData[0]);
const csvRows = [headers.join(',')];

for (const row of fixedData) {
    const values = headers.map(header => {
        const val = row[header] || '';
        // Wrap in quotes if contains comma
        return val.toString().includes(',') ? `"${val}"` : val;
    });
    csvRows.push(values.join(','));
}

const fixedCsvPath = path.join('..', 'frontend', 'assets', 'Jadwal_DPB_FIXED.csv');
fs.writeFileSync(fixedCsvPath, csvRows.join('\n'));

console.log(`Success! Fixed data saved to: ${fixedCsvPath}`);
// Also print some samples for verification
console.log('Sample Mappings:');
const samples = fixedData.slice(0, 10);
samples.forEach((row, i) => {
    console.log(`${excelData[i].TeacherEmail} -> ${row.TeacherEmail}`);
});
