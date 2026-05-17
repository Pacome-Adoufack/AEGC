const payload = {
    fullName: 'Test User',
    email: 'test@example.com',
    phone: '237600000000',
    affiliation: 'Test',
    notes: 'test'
};

const formData = new FormData();
formData.append('submissionMethod', 'online');
formData.append('currency', 'XAF');
formData.append('category', 'standard');
formData.append('formData', JSON.stringify(payload));

try {
    const response = await fetch('http://localhost:3000/api/membership/submit', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + process.env.TOKEN
        },
        body: formData
    });
    
    const status = response.status;
    const body = await response.text();
    console.log('STATUS:', status);
    console.log('BODY:', body);
} catch (error) {
    console.error('ERROR:', error.message);
}
