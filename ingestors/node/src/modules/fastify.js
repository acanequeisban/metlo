const ritm = require("require-in-the-middle")

function versionCheck() {
    return true
}

const METLO_DETAILS = {
    key: "",
    host: "",
    pool: null
}

function initialize({ key, host, pool }) {
    if (versionCheck()) {
        METLO_DETAILS.key = key
        METLO_DETAILS.host = host
        METLO_DETAILS.pool = pool


        async function compileInformation(request, response) {
            const data = JSON.stringify(
                {
                    request: {
                        url: {
                            host: request.hostname,
                            path: request.routerPath,
                            parameters: Object.entries(request.query).map(([k, v]) => ({ name: k, value: v })),
                        },
                        headers: Object.entries(request.headers).map(([k, v]) => ({ name: k, value: v })),
                        body: request.body || "No Body",
                        method: request.method,
                    },
                    response: {
                        url: `${response.raw.socket.remoteAddress}:${response.raw.socket.remotePort}`,
                        status: response.statusCode,
                        headers: Object.entries(response.headers).map(([k, v]) => ({ name: k, value: v })),
                        body: response.body,
                    },
                    meta: {
                        environment: process.env.NODE_ENV,
                        incoming: true,
                        source: request.raw.socket.remoteAddress,
                        sourcePort: request.raw.socket.remotePort,
                        // TODO : Add destination
                        destination: "server.hostname",
                        destinationPort: "server.port",
                    }
                }
            )

            METLO_DETAILS.pool.runTask({ host: METLO_DETAILS.host, key: METLO_DETAILS.key, data })
        }

        ritm(['fastify'], function (exports, name, basedir) {

            const originalFastify = exports
            function modifiedFastify() {
                let fastifyInst = originalFastify.apply(this, arguments)
                fastifyInst.addHook("onSend", async (request, reply, payload) => {
                    compileInformation(request, reply)
                    return payload
                })
                return fastifyInst
            }
            exports = modifiedFastify

            return exports
        })
    }
}
module.exports = { init: initialize }