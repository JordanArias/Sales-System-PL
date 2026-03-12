// export const configuration = {
//     // url: `http://${window.location.hostname}:3000/api`
//       // url: `http://${location.hostname}:3000/api`
//     url: 'http://192.168.1.17:3000/api' //Villa
//   };






// Angular configuration
export const configuration = {
  url: navigator.userAgent.toLowerCase().includes('electron')
    ? 'http://localhost:3000/api'
    : 'http://192.168.1.12:3000/api' // otros dispositivos
};