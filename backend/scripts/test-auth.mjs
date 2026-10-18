import http from 'http'

function get(path) {
  return new Promise((resolve) => {
    http.get({ host: 'localhost', port: 5000, path }, (res) => {
      let body = ''
      res.on('data', (d) => (body += d))
      res.on('end', () => resolve({ status: res.statusCode, body: body.slice(0, 200) }))
    }).on('error', (e) => resolve({ status: 'ERR', body: e.message }))
  })
}

async function run() {
  const [a, b] = await Promise.all([
    get('/api/candidates'),
    get('/api/dashboard/stats'),
  ])
  console.log('GET /api/candidates (no cookie):', a.status, a.body)
  console.log('GET /api/dashboard/stats (no cookie):', b.status, b.body)
}

run()
