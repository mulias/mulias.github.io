const encoder = new TextEncoder();
const decoder = new TextDecoder();

var out = "";
var err = "";

const importObject = {
  env: {
    writeOut: (ptr, len) => {
      const text = decoder.decode(
        new Uint8Array(wasm.memory.buffer.slice(ptr, ptr + len))
      );
      out += text;
    },
    writeErr: (ptr, len) => {
      const text = decoder.decode(
        new Uint8Array(wasm.memory.buffer.slice(ptr, ptr + len))
      );
      console.log(text);
      err += text;
    },
  },
};

var wasm;

fetch('/js/possum-lib.wasm')
  .then((response) => response.arrayBuffer())
  .then((bytes) => WebAssembly.instantiate(bytes, importObject))
  .then((result) => {
    wasm = result.instance.exports;
    console.log(wasm);
  });

function interpret(parser, input) {
  var parserSlice = allocateString(wasm, parser);
  var inputSlice = allocateString(wasm, input);

  var vm = wasm.createVM();
  wasm.interpret(vm, parserSlice.ptr, parserSlice.len, inputSlice.ptr, inputSlice.len);
  wasm.dealloc(parserSlice.ptr, parserSlice.len);
  wasm.dealloc(inputSlice.ptr, inputSlice.len);
  wasm.destroyVM(vm);
}

document.querySelectorAll('.possum-example').forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault()
    const data = new FormData(event.target);

    out = "";
    err = "";

    const form = event.target;
    const outputElt = form.getElementsByClassName("output")[0];

    while (outputElt.firstChild) {
      outputElt.removeChild(outputElt.firstChild);
    }

    const parser = data.get("possumParser");
    const input = data.get("possumInput");

    console.log({parser, input});

    interpret(parser, input);

    console.log({out, err});

    const labelText = document.createElement("span")
    labelText.classList.add("label-text");

    const result = document.createElement("pre")
    result.innerText = out || err;

    const reset = document.createElement("span")
    reset.classList.add("reset");
    reset.innerText = "reset";
    reset.addEventListener("click", () => {
      outputElt.classList.remove("fade-in");
      while (outputElt.firstChild) {
        outputElt.removeChild(outputElt.firstChild);
      }

      const inputElem = form.querySelector('*[name="possumInput"]');
      inputElem.value = inputElem.dataset.reset;

      const parserElem = form.querySelector('*[name="possumParser"]');
      parserElem.value = parserElem.dataset.reset;
    }, { once: true });

    if (out.length > 0) {
      labelText.innerText = "Success";
      outputElt.classList.remove("failure");
      outputElt.classList.add("success");
    } else if (err.length > 0) {
      labelText.innerText = "Failure";
      outputElt.classList.remove("success");
      outputElt.classList.add("failure");
    }

    outputElt.classList.add("fade-in");
    outputElt.appendChild(labelText);
    outputElt.appendChild(result);
    outputElt.appendChild(reset);
  });
});

function allocateString(wasm, str) {
  // convert source to Uint8Array
  const sourceArray = encoder.encode(str);

  // get memory from wasm
  const len = sourceArray.length;

  const ptr = wasm.alloc(len);
  if (ptr === 0) throw 'Cannot allocate memory';

  // copy sourceArray to wasm
  var memoryu8 = new Uint8Array(wasm.memory.buffer);
  for (let i = 0; i < len; ++i) {
    memoryu8[ptr + i] = sourceArray[i];
  }

  return { ptr, len };
}

