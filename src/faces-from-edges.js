
function facesFromEdges(edges) {
    var chains = joinEdges(edges).filter(validFace);
    var faces = chains.map(function(chain) {
        return chain.map(function(edge) {
            return edge[0];
        });
    });
    return faces;
}

function joinEdges(edges) {
    changes = true;
    var chains = edges.map(function(edge) {
        return [edge];
    });
    while (changes) {
        changes = connectChains(chains);
    }
    chains = chains.filter(function(chain) {
        return chain.length; 
    });
    return chains;
}

function connectChains(chains) {
    chains.forEach(function(chainA, i) {
        chains.forEach(function(chainB, j) {
            var merged = mergeChains(chainA, chainB);
            if (merged) {
                delete chains[j];
                return true;
            }
        });
    });
    return false;
}

function mergeChains(chainA, chainB) {

    if (chainA === chainB) {
        return false;
    }

    if (chainStart(chainA) === chainEnd(chainB)) {
        chainA.unshift.apply(chainA, chainB);
        return true;
    }

    if (chainStart(chainA) === chainStart(chainB)) {
        reverseChain(chainB);
        chainA.unshift.apply(chainA, chainB);
        return true;
    }

    if (chainEnd(chainA) === chainStart(chainB)) {
        chainA.push.apply(chainA, chainB);
        return true;
    }

    if (chainEnd(chainA) === chainEnd(chainB)) {
        reverseChain(chainB);
        chainA.push.apply(chainA, chainB);
        return true;
    }

    return false;
}

function chainStart(chain){
    return chain[0][0];
}

function chainEnd(chain) {
    return chain[chain.length - 1][1];
}

function reverseChain(chain) {
    chain.reverse();
    chain.forEach(function(edge) {
        edge.reverse();
    });
}

function validFace(chain) {
    return chainStart(chain) === chainEnd(chain) ? 1 : 0;
}

module.exports = facesFromEdges;
