
function facesFromEdges(edges) {
    var chains = joinEdges(edges).filter(validFace);
    chains = chains.map(function(chain) {
        return chain.slice(1);
    })
    return chains;
}

function joinEdges(edges) {
    var lastConnected;
    var connected = edges;
    while (connected !== lastConnected) {
        lastConnected = connected;
        connected = connectChains(lastConnected);
    }
    return connected;
}

function connectChains(chains) {
    var len = chains.length;
    for (var i = 0; i < len; i++) {
        for (var j = 0; j < len; j++) {
            if (i === j) {
                continue;
            }
            var merged = mergeChains(chains[i], chains[j]);
            if (merged) {
                chains = chains.filter(function(_, k) {
                    return k !== i && k !== j;
                });
                chains.unshift(merged);
                return chains;
            }
        }
    }
    return chains;
}

function mergeChains(chainA, chainB) {

    if (chainEnd(chainB) === chainStart(chainA)) {
        var chain = chainB.slice(0,-1);
        chain.push.apply(chain, chainA);
        return chain;
    }

    if (chainEnd(chainA) === chainStart(chainB)) {
        var chain = chainA.slice(0,-1);
        chain.push.apply(chain, chainB);
        return chain;
    }

    if (chainStart(chainA) === chainStart(chainB)) {
        var chain = chainB.slice(1).reverse();
        chain.push.apply(chain, chainA);
        return chain;
    }

    if (chainEnd(chainA) === chainEnd(chainB)) {
        var chain = chainA.slice(0,-1).reverse();
        chain.unshift.apply(chain, chainB);
        return chain;
    }

    return false;
}

function chainStart(chain){
    return chain[0];
}

function chainEnd(chain) {
    return chain[chain.length - 1];
}

function validFace(chain) {
    if (chain.length < 3) {
        return 0;
    }
    return chainStart(chain) === chainEnd(chain) ? 1 : 0;
}

module.exports = facesFromEdges;
