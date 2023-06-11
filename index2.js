/** @typedef {Global.Shelf} Shelf */
/** @typedef {Global.JSONValue} JSON */

/**
 * Create a new shelf, initialized with any JSON value.
 *
 * Optional: provide a version for all nodes in the Shelf. If version is set to
 *   null, then the created shelf is essentially "always greater" than any shelf
 *   with numeric versions.
 *
 * @param {JSON} j
 * @param {Global.ShelfVersion} version
 * @returns {Shelf}
 */
export const create = (j, version = 0) => {
  return isObj(j)
    ? /** @type {Shelf} */
      [
        remap(j, {
          mapper:
            /** @type {Global.ObjectMapper} */
            ([k, v]) => [k, create(v, version)],
        }),
        version,
      ]
    : /** @type {Shelf} */ [j ?? null, version];
};

/**
 * Read the value of a Shelf, recursively.
 *
 * Optional: provide additional args as a "path" to a sub-Shelf
 * e.g.
 *   const shelf = create({ name: { first: "Greg" } })
 *   read(shelf, 'name', 'first') // == "Greg"
 *
 * @param {Shelf} s
 * @param  {...string} path
 * @returns {JSON}
 */
export const read = (s, ...path) => {
  if (!isShelfShallow(s)) throw Error(`not a shelf`);

  // Iterate over the path until we arrive at the Shelf it specifies
  s = path.reduce(
    /**
     *
     * @param {Shelf} s
     * @param {string} x
     * @returns {Shelf}
     */
    (s, x) => {
      if (isObj(s[0])) return s[0][x];
      else throw Error("path does not match shelf");
    },
    s
  );

  if (s && isObj(s[0])) {
    return remap(s[0], {
      // filter: ([, v]) => v != null,
      mapper: ([k, v]) => [k, read(v)],
    });
  } else return s?.[0] ?? null;
};

/**
 * Merge Shelf B into Shelf A (modifying A).
 *
 * If modify is false, do not modify A; instead, return a Shelf representing
 * what would have changed in A, had the merge taken place.
 *
 * @param {Shelf} a
 * @param {Shelf} b
 * @returns {Shelf | null}
 */
export const merge = (a, b, modify = true) => {
  /** @type {Shelf | null} */ let change = null;

  // console.log("merge", a, b);

  if (!isShelf(a)) throw Error(`a is not a shelf: ${json(a, 2)}`);
  if (!isShelf(b)) throw Error(`b is not a shelf: ${json(b, 2)}`);

  // Special case: if Shelf B's version is null, we guarantee B's value overrides A's value
  if (b[1] === null) b = [b[0], (a[1] ?? 0) + (equal(a[0], b[0]) ? 0 : 1)];

  if (
    // In javascript logic, `null` is greater than any number, so
    // if version `b[1]` is null, it will be greater than `(a[1] ?? -1)`
    // @ts-ignore
    b[1] > (a[1] ?? -1) ||
    (b[1] === a[1] && greaterThan(b[0], a[0]))
  ) {
    // B > A if B.version > A.version OR versions are the same but B.value > A.value

    if (isObj(b[0])) {
      // If B is an object, then its values MUST be shelves
      if (modify) {
        a[0] = {};
        a[1] = b[1];
      }
      change = merge(modify ? a : [{}, b[1]], b, modify);
    } else {
      if (modify) {
        a[0] = JSON.parse(JSON.stringify(b[0]));
        a[1] = b[1];
      }
      change = JSON.parse(JSON.stringify(b));
    }
  } else if (b[1] === a[1]) {
    // prettier-ignore
    const a_obj = a[0], b_obj = b[0];

    if (isObj(a_obj) && isObj(b_obj)) {
      // B == A, and each has a Shelf for its value

      for (let [k, v] of Object.entries(b_obj)) {
        // Each value in the object MUST be a shelf
        if (!isShelfShallow(v)) throw Error(`not a shelf: ${(json(v), 2)}`);

        if (modify && !a_obj[k]) a_obj[k] = [null, -1];

        let diff = merge(a_obj[k], v, modify);
        if (diff) {
          if (!change) change = [{}, b[1]];
          if (isObj(change[0])) change[0][k] = diff;
          else throw Error(`expected obj: ${json(change[0], 2)}`);
        }
      }
    }
  }

  return change;
};

/**
 *
 * @param {Shelf} a
 * @param {Shelf} b
 * @returns {Shelf | null}
 */
export const getChange = (a, b) => merge(a, b, false);

export const localUpdate = (backend, frontend, overrideNewVersion) => {
  if (equal(backend[0], frontend)) {
    if (isObj(frontend)) {
      var ret = [{}, backend[1]];
      for (let [k, v] of Object.entries(backend[0])) {
        if (v[0] != null && frontend[k] == null) {
          v[0] = null;
          v[1] = overrideNewVersion || (v[1] ?? -1) + 1;
          ret[0][k] = v;
        }
      }
      for (let [k, v] of Object.entries(frontend)) {
        if (!backend[0][k]) backend[0][k] = [null, -1];
        let changes = localUpdate(backend[0][k], v, overrideNewVersion);
        if (changes) ret[0][k] = changes;
      }
      return Object.keys(ret[0]).length ? ret : null;
    }
  } else {
    backend[1] = overrideNewVersion || (backend[1] ?? -1) + 1;
    if (isObj(frontend)) {
      backend[0] = {};
      for (let [k, v] of Object.entries(frontend)) {
        if (isObj(v)) {
          backend[0][k] = [null, -1];
          localUpdate(backend[0][k], v, overrideNewVersion);
        } else {
          backend[0][k] = [v, 0];
        }
      }
    } else backend[0] = frontend;
    return backend;
  }
};

export const remoteUpdate = (a, f, b) => {
  if (b[1] > (a[1] ?? -1) || (b[1] == a[1] && greaterThan(b[0], a[0]))) {
    a[1] = b[1];
    if (!isObj(a[0]) && isObj(f) && isObj(b[0])) {
      a[0] = {};
      return remoteUpdate(a, f, b);
    }
    if (isObj(b[0])) {
      a[0] = {};
      merge(a, b);
    } else a[0] = b[0];
    f = read(a);
  } else if (b[1] == a[1] && isObj(a[0]) && isObj(b[0])) {
    if (isObj(f)) {
      for (let [k, v] of Object.entries(b[0])) {
        if (!a[0][k]) a[0][k] = [null, -1];
        f[k] = remoteUpdate(a[0][k], f[k], v);
        if (f[k] == null) delete f[k];
      }
    } else merge(a, b);
  }
  return f;
};

/**
 * Checks if the value is an object.
 *
 * @param {*} o The value to check.
 * @returns {o is Record<PropertyKey, unknown>} True if the given parameter is an object, false otherwise.
 */
export const isObj = (o) => o === Object(o) && !Array.isArray(o);

/**
 * Recursively checks if the value is a Shelf.
 *
 * @param {any} s The value to check.
 * @returns {s is Shelf}
 */
export const isShelf = (s) => {
  return (
    isShelfShallow(s) &&
    (isObj(s[0]) ? Object.entries(s[0]).every(([, v]) => isShelf(v)) : true)
  );
};

/**
 * IF:     isObj(A)   isObj(B)     Result
 *            T          T           F
 *            T          F           T
 *            F          T           F
 *            F          F           JSON(A) > JSON(B)
 *
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
export const greaterThan = (a, b) => {
  if (isObj(b)) return false;
  if (isObj(a)) return true;
  return json(a) > json(b);
};

/**
 *
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
export const equal = (a, b) => {
  if (isObj(a)) return isObj(b);
  if (isObj(b)) return false;
  return json(a) == json(b);
};

/**
 * Stringify a JSON value, with nice formatting
 *
 * @param {JSON} j
 * @param {number | undefined} s
 * @returns {string}
 */
const json = (j, s = undefined) => JSON.stringify(j, null, s);

/**
 * Map over an object, returning a new object with same keys mapped to new values.
 *
 * @param {Record<string, any>} o
 * @param {{ mapper: Global.ObjectMapper, filter?: Global.ObjectFilter }} fn
 * @returns {Record<string, any>}
 */
const remap = (o, { mapper, filter = (v) => true }) =>
  Object.fromEntries(Object.entries(o).filter(filter).map(mapper));

/**
 * Checks if the value is a Shelf, but does not recurse.
 *
 * @param {any} s The value to check.
 * @returns {s is Shelf}
 */
const isShelfShallow = (s) =>
  Array.isArray(s) &&
  s.length == 2 &&
  (s[1] === null || Number.isInteger(s[1]));
