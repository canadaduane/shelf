import test from "ava";

import * as shelf from "./index2.js";

/**
 * @typedef {Global.Shelf} Shelf
 * @typedef {Global.Mask} Mask
 * @typedef {Global.JSONValue} JSON
 */

// test("read: null value in Shelf", (t) => {
//   t.deepEqual(shelf.read([null, 0]), null);
// });

// test("read: string in Shelf", (t) => {
//   t.deepEqual(shelf.read(["a", 0]), "a");
// });

// test("read: object in Shelf", (t) => {
//   t.deepEqual(shelf.read([{ s: [1, 0] }, 0]), { s: 1 });
// });

// test("read: null value in object in Shelf", (t) => {
//   t.deepEqual(shelf.read([{ s: [null, 0] }, 0]), { s: null });
// });

// test("read: path", (t) => {
//   t.deepEqual(shelf.read([{ s: [{ a: ["hi", 0] }, 0] }, 0], "s", "a"), "hi");
// });

// test("read: create then read", (t) => {
//   const s = shelf.create({
//     profile: { name: { first: "Dwayne", last: "Johnson" } },
//   });
//   t.deepEqual(shelf.read(s, "profile", "name"), {
//     first: "Dwayne",
//     last: "Johnson",
//   });
// });

// test("create: shelf w/ number", (t) => {
//   let v = 1;
//   t.deepEqual(shelf.create(v), [1, 0]);
// });

// test("create: shelf w/ array", (t) => {
//   let v = ["hi"];
//   t.deepEqual(shelf.create(v), [["hi"], 0]);
// });

// test("create: shelf w/ object", (t) => {
//   let v = { a: 1 };
//   t.deepEqual(shelf.create(v), [{ a: [1, 0] }, 0]);
// });

// test("create: shelf w/ recursive object", (t) => {
//   let v = { a: 1, b: { c: 2 } };
//   t.deepEqual(shelf.create(v), [{ a: [1, 0], b: [{ c: [2, 0] }, 0] }, 0]);
// });

// test("merge: A modified by B", (t) => {
//   let a = shelf.create({ a: 1, b: { c: 2 } });
//   let b = shelf.create({ b: { c: 3 } });
//   shelf.merge(a, b);
//   t.deepEqual(a, shelf.create({ a: 1, b: { c: 3 } }));
//   t.deepEqual(b, shelf.create({ b: { c: 3 } }));
// });

// test("merge: B modified by A", (t) => {
//   let a = shelf.create({ a: 1, b: { c: 2 } });
//   let b = shelf.create({ b: { c: 3 } });
//   shelf.merge(b, a);
//   t.deepEqual(a, shelf.create({ a: 1, b: { c: 2 } }));
//   t.deepEqual(b, shelf.create({ a: 1, b: { c: 3 } }));
// });

// test("merge: null values", (t) => {
//   /** @type {Shelf} */ const a = [null, -1];
//   /** @type {Shelf} */ const b = [null, 0];
//   shelf.merge(a, b);
//   t.deepEqual(a, [null, 0]);
// });

// test("merge: null value becomes non-null value", (t) => {
//   /** @type {Shelf} */ const a = [null, -1];
//   /** @type {Shelf} */ const b = [1, 0];
//   shelf.merge(a, b);
//   t.deepEqual(a, [1, 0]);
// });

// test("merge: old version has no effect", (t) => {
//   /** @type {Shelf} */ const a = [1, 1];
//   /** @type {Shelf} */ const b = [2, 0];
//   shelf.merge(a, b);
//   t.deepEqual(a, [1, 1]);
// });

// test("merge: new version overwrites", (t) => {
//   /** @type {Shelf} */ const a = [{ a: ["hi", 0] }, 1];
//   /** @type {Shelf} */ const b = [2, 2];
//   shelf.merge(a, b);
//   t.deepEqual(a, [2, 2]);
// });

// test("merge: null version overwrites value, increments version", (t) => {
//   /** @type {Shelf} */ const a = [{ a: ["hi", 0] }, 10];
//   /** @type {Shelf} */ const b = [2, null];
//   shelf.merge(a, b);
//   t.deepEqual(a, [2, 11]);
// });

// test("merge: returns change", (t) => {
//   /** @type {Shelf} */ const a = [{ a: ["hi", 0] }, 10];
//   /** @type {Shelf} */ const b = [{ a: ["bye", null] }, null];
//   const change = shelf.merge(a, b);
//   t.deepEqual(change, [{ a: ["bye", 1] }, 10]);
// });

// test("merge: returns change for null", (t) => {
//   /** @type {Shelf} */ const a = [null, 10];
//   /** @type {Shelf} */ const b = [1, null];
//   const change = shelf.merge(a, b);
//   t.deepEqual(change, [1, 11]);
// });

test("merge: returns null when no difference", (t) => {
  // prettier-ignore
  /** @type {Shelf} */ const a_shelf = [{ a: [{}, 1   ], b: [28, 0   ] }, 0   ];
  // prettier-ignore
  /** @type {Shelf} */ const a_tweak = [{ a: [{}, null], b: [28, null] }, null];
  const change = shelf.merge(a_shelf, a_tweak);
  t.is(change, null);
});

test("merge: make a message", (t) => {
  /** @type {Shelf} */ const s = [{ a: [{}, 1], b: [28, 0] }, 0];
  /** @type {Shelf} */ const tweak = [
    { a: [{ c: ["hi", 0] }, null], b: [28, 0] },
    null,
  ];
  /** @type {Shelf} */ const msg = [null, 0];

  const change = shelf.merge(s, tweak);
  t.deepEqual(s, [{ a: [{ c: ["hi", 0] }, 1], b: [28, 0] }, 0]);
  t.deepEqual(change, [{ a: [{ c: ["hi", 0] }, 1] }, 0]);

  if (change) shelf.merge(msg, change);
  t.deepEqual(msg, [{ a: [{ c: ["hi", 0] }, 1] }, 0]);
});

if (false)
  test("merge: change", (t) => {
    /** @type {Shelf} */ const b = [0, 57];
    /** @type {Shelf} */ const b_twk = [
      { l: [null, null], zz: [1, null] },
      null,
    ];

    debugger;
    const b_change = shelf.merge(b, b_twk);
    t.deepEqual(b, [{ l: [null, -1], zz: [1, 0] }, 58]);
    t.deepEqual(b_change, [{ l: [null, -1], zz: [1, 0] }, 58]);
  });

// if (false)
  test("merge: make a message (2)", (t) => {
    /** @type {Shelf} */ const a = [{ j: [18, 0] }, 49];
    /** @type {Shelf} */ const a_twk = [{ j: [2, null] }, null];

    const a_change = shelf.merge(a, a_twk);
    t.deepEqual(a, [{ j: [2, 1] }, 49]);
    t.deepEqual(a_change, [{ j: [2, 1] }, 49]);

    /** @type {Shelf} */ const b = [0, 57];
    /** @type {Shelf} */ const b_twk = [
      { l: [null, null], zz: [1, null] },
      null,
    ];

    const b_change = shelf.merge(b, b_twk);
    t.deepEqual(b, [{ l: [null, -1], zz: [1, 0] }, 58]);
    t.deepEqual(b_change, [{ zz: [1, 0] }, 58]);

    // debugger
    if (b_change) shelf.merge(a, b_change);
    if (a_change) shelf.merge(b, a_change);

    t.deepEqual(a, b);
  });

if (false)
test("merge: random permutations", (t) => {
  /** @type {Shelf} */ let a = [null, -1];
  /** @type {Shelf} */ let b = [null, -1];
  /** @type {Shelf} */ let a_msg = [null, -1];
  /** @type {Shelf} */ let b_msg = [null, -1];

  let n = 10000;
  for (var i = 0; i < n; i++) {
    const a_str = JSON.stringify(a);
    const a_str_read = JSON.stringify(shelf.read(a));
    const b_str = JSON.stringify(b);
    const b_str_read = JSON.stringify(shelf.read(b));

    t.assert(shelf.isShelf(a));
    t.assert(shelf.isShelf(b));
    t.assert(shelf.isShelf(a_msg));
    t.assert(shelf.isShelf(b_msg));

    let a_tks = undefined;
    if (Math.random() < 0.5) {
      let tk = tweakJSON(shelf.read(a));
      a_tks = shelf.create(tk, null);
      let m = shelf.merge(a, a_tks);
      if (m) shelf.merge(b_msg, m);
    }
    const a_tks_str = JSON.stringify(a_tks);

    let b_tks = undefined;
    if (Math.random() < 0.5) {
      let tk = tweakJSON(shelf.read(b));
      b_tks = shelf.create(tk, null);
      let m = shelf.merge(b, b_tks);
      if (m) shelf.merge(a_msg, m);
    }
    const b_tks_str = JSON.stringify(b_tks);

    const a2_str = JSON.stringify(a);
    const a2_str_read = JSON.stringify(shelf.read(a));
    const b2_str = JSON.stringify(b);
    const b2_str_read = JSON.stringify(shelf.read(b));

    const a_msg_str = JSON.stringify(a_msg);
    const a_msg_str_read = JSON.stringify(shelf.read(a_msg));
    const b_msg_str = JSON.stringify(b_msg);
    const b_msg_str_read = JSON.stringify(shelf.read(b_msg));

    if (Math.random() < 0.1) {
      shelf.merge(a, a_msg);
      shelf.merge(b, b_msg);
      a_msg = [null, -1];
      b_msg = [null, -1];

      const a_final_str = JSON.stringify(a);
      const a_final_str_read = JSON.stringify(shelf.read(a));
      const b_final_str = JSON.stringify(b);
      const b_final_str_read = JSON.stringify(shelf.read(b));
      t.deepEqual(
        shelf.read(a),
        shelf.read(b),
        `
        a: ${a_str}
        read(a): ${a_str_read}
        b: ${b_str}
        read(b): ${b_str_read}

        a_tks: ${a_tks_str}
        b_tks: ${b_tks_str}

        a2: ${a2_str}
        read(a2): ${a2_str_read}
        b2: ${b2_str}
        read(b2): ${b2_str_read}

        a_msg: ${a_msg_str}
        read(a_msg): ${a_msg_str_read}
        b_msg: ${b_msg_str}
        read(b_msg): ${b_msg_str_read}

        a_final: ${a_final_str}
        read(a_final): ${a_final_str_read}
        b_final: ${b_final_str}
        read(b_final): ${b_final_str_read}
      `
      );
    }
  }
});

function createRandomString() {
  return String.fromCharCode(
    "a".charCodeAt(0) + Math.floor(Math.random() * 26)
  ).repeat(Math.floor(Math.random() * 3) + 1);
}

/**
 *
 * @returns {JSON}
 */
function createRandomValue() {
  if (Math.random() < 0.2) {
    /**
     * @type {JSON}
     */
    let x = {};
    let n = Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      let k = createRandomString();
      x[k] = createRandomValue();
    }
    return x;
  } else if (Math.random() < 0.25) return Math.floor(Math.random() * 100);
  else if (Math.random() < 0.333) return createRandomString();
  else if (Math.random() < 0.5) return Math.random() < 0.5;
  else if (Math.random() < 0.5) return null;
  else {
    let a = [];
    let n = Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) a.push(createRandomValue());
    return a;
  }
}

/**
 * Given an array of values, pick one of the values at random.
 *
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Given a JSON value, randomly change it in some way.
 *
 * @param {JSON} x A JSON value to tweak
 * @returns {JSON}
 */
function tweakJSON(x) {
  if (shelf.isObj(x)) {
    if (Math.random() < 0.2) {
      return null;
    } else {
      let k = Math.random() < 0.8 && pick(Object.keys(x));
      if (!k) k = createRandomString();
      x[k] = tweakJSON(x[k] ?? null);
      return x;
    }
  } else {
    /**
     * @type {JSON}
     */
    let new_val = x;
    while (shelf.equal(new_val, x)) new_val = createRandomValue();
    return new_val;
  }
}
