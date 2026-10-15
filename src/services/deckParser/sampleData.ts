export interface WorkspaceSample {
  id: string;
  label: string;
  description: string;
  deckTitle: string;
  content: string;
}

export const WORKSPACE_SAMPLES: WorkspaceSample[] = [
  {
    id: "stem-latex",
    label: "Mathematics & KaTeX",
    description: "Formulas, theorems, and LaTeX expressions",
    deckTitle: "Calculus & Linear Algebra",
    content: `# Mathematics & Physics Notes

### Question
What is the formula for the Taylor series expansion of \\( f(x) \\) around \\( a \\)?
### Answer
$$f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x - a)^n$$

### Question
What defines an eigenvalue \\( \\lambda \\) and eigenvector \\( \\mathbf{v} \\) for matrix \\( A \\)?
### Answer
A non-zero vector \\( \\mathbf{v} \\) satisfies:
$$A \\mathbf{v} = \\lambda \\mathbf{v}$$
Equivalently, \\( \\det(A - \\lambda I) = 0 \\).

### Question
What is Euler's identity?
### Answer
$$e^{i\\pi} + 1 = 0$$
It connects five fundamental mathematical constants: \\( e, i, \\pi, 1, \\text{and } 0 \\).
`,
  },
  {
    id: "cs-qa",
    label: "Computer Science (Q&A)",
    description: "Concepts, system design, and definitions",
    deckTitle: "Computer Science Core",
    content: `### Question
What is the Halting Problem and why is it undecidable?
### Answer
The Halting Problem asks whether a program \\( P \\) halts on input \\( x \\). Alan Turing proved in 1936 that no universal Turing Machine can decide this for all program-input pairs.

### Question
Explain the difference between TCP and UDP.
### Answer
- **TCP (Transmission Control Protocol)**: Connection-oriented, guarantees packet ordering and reliable delivery via handshakes and retransmissions.
- **UDP (User Datagram Protocol)**: Connectionless, sends datagrams without delivery acknowledgment (lower latency, ideal for VoIP/gaming).

### Question
What are the three guarantees of the CAP Theorem?
### Answer
In any distributed data store, you can achieve at most two of:
1. **Consistency**: Every read receives the most recent write or an error.
2. **Availability**: Every non-failing node returns a response for every request.
3. **Partition Tolerance**: The system continues to operate despite arbitrary network drops.
`,
  },
  {
    id: "json-deck",
    label: "JSON Cards Array",
    description: "Structured JSON cards with custom tags",
    deckTitle: "Web Architecture Cards",
    content: `[
  {
    "front": "What is the purpose of HTTP/2 Multiplexing?",
    "back": "It allows multiple concurrent requests and responses over a single TCP connection, eliminating head-of-line blocking at the application layer."
  },
  {
    "front": "What does CORS stand for and what problem does it solve?",
    "back": "**Cross-Origin Resource Sharing**. It is a browser security mechanism that allows or restricts resources requested from another domain outside the domain from which the first resource was served."
  },
  {
    "front": "What is the difference between Optimistic and Pessimistic Locking?",
    "back": "- **Optimistic**: Assumes conflicts are rare; validates version timestamp at commit time.\\n- **Pessimistic**: Locks the record at read time until the transaction finishes."
  }
]`,
  },
  {
    id: "multi-field-notes",
    label: "Multi-Field (Notes & Sources)",
    description: "Hierarchical headings with custom fields like Notes and Sources",
    deckTitle: "Physics & Classical Mechanics",
    content: `# Card 1
## Front
What is Newton's First Law of Motion?
## Back
An object remains at rest or in uniform motion in a straight line, unless acted upon by a net external force.
## Notes
Also known as the Law of Inertia. First formulated in *Philosophiæ Naturalis Principia Mathematica* (1687).
## Sources
Classical Mechanics - Goldstein

# Card 2
## Front
State Newton's Second Law of Motion in differential form.
## Back
The rate of change of momentum of a body over time is equal to the net force applied:
$$\\mathbf{F} = \\frac{d\\mathbf{p}}{dt} = m \\mathbf{a}$$
## Notes
Valid in inertial reference frames. For constant mass $m$, reduces to $\\mathbf{F} = m\\mathbf{a}$.
## Sources
Feynman Lectures on Physics, Vol. 1
`,
  },
];
