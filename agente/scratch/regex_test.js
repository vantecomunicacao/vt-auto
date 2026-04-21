const reply = "Texto do veículo.\n\n[Enviarei as fotos]\n\nPergunta final?"
console.log("Original:\n", JSON.stringify(reply))

// Current aggressive cleaning
const currentClean = reply.replace(/\[(?:enviar|enviando|enviarei|fotos|imagens|photos|foto)[^\]]*\]/gi, '').replace(/^\s*\n/gm, '').trim()
console.log("Current cleaning result:\n", JSON.stringify(currentClean))
console.log("Has double newline?", currentClean.includes('\n\n'))

// Proposed cleaning
const proposedClean = reply
  .replace(/\[(?:enviar|enviando|enviarei|fotos|imagens|photos|foto)[^\]]*\]/gi, '')
  .replace(/\n{3,}/g, '\n\n') // Collapses 3+ newlines to 2
  .trim()

console.log("Proposed cleaning result:\n", JSON.stringify(proposedClean))
console.log("Has double newline?", proposedClean.includes('\n\n'))
