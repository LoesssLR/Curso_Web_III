try {
  const serviceAccount = require('./service-account-key.json');
  console.log('ARCHIVO CARGADO CORRECTAMENTE');
  console.log('Project ID:', serviceAccount.project_id);
  console.log('Client Email:', serviceAccount.client_email);
  console.log('Tiene private_key?:', serviceAccount.private_key ? 'SÍ' : 'NO');
} catch (error) {
  console.log(' ERROR:', error.message);
}