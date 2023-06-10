export const shelf = {};

shelf.wrap = (s) =>
  isObj(s)
    ? Object.fromEntries(Object.entries(s).map(([k, v]) => [k, shelf.wrap(v)]))
    : [s];

shelf.create = (init) => {
  let x = [null, -1];
  if (init !== undefined) shelf.merge(x, shelf.wrap(init));
  return x;
};

shelf.read = (s, ...path) => {
  s = path.reduce((s, x) => s?.[0]?.[x], s);
  if (s && isObj(s[0])) {
    return Object.fromEntries(
      Object.entries(s[0])
        .map(([k, v]) => [k, shelf.read(v)])
        .filter(([k, v]) => v != null)
    );
  } else return s?.[0];
};

shelf.getChange = (a, b) => {
  return shelf.merge(a, b, true);
};

shelf.merge = (a, b, dont_modify) => {
  let change = null;

  if (!a) a = [null, -1];
  if (!Array.isArray(b)) b = [b];

  let both_objs = isObj(a[0]) && isObj(b[0]);
  let eq = equal(a[0], b[0]);

  if (b[1] == null) b = [b[0], a[1] + (eq ? 0 : 1)];

  if (b[1] > (a[1] ?? -1) || (b[1] == a[1] && greaterThan(b[0], a[0]))) {
    if (isObj(b[0])) {
      if (!dont_modify) {
        a[0] = {};
        a[1] = b[1];
      }
      change = shelf.merge(dont_modify ? [{}, b[1]] : a, b, dont_modify);
      if (!change) change = [{}, b[1]];
    } else {
      if (!dont_modify) {
        a[0] = b[0];
        a[1] = b[1];
      }
      change = b;
    }
  } else if (b[1] == a[1] && both_objs) {
    for (let [k, v] of Object.entries(b[0])) {
      if (!dont_modify && !a[0][k]) a[0][k] = [null, -1];
      let diff = shelf.merge(a[0][k], v, dont_modify);
      if (diff) {
        if (!change) change = [{}, b[1]];
        change[0][k] = diff;
      }
    }
  }
  return change;
};

shelf.mask = (s, mask) => {
  return mask == true || !isObj(s[0])
    ? s
    : [
        Object.fromEntries(
          Object.entries(mask)
            .filter(([k, v]) => s[0][k])
            .map(([k, v]) => [k, shelf.mask(s[0][k], v)])
        ),
        s[1],
      ];
};

shelf.localUpdate = (backend, frontend, override_new_version) => {
  if (equal(backend[0], frontend)) {
    if (isObj(frontend)) {
      var ret = [{}, backend[1]];
      for (let [k, v] of Object.entries(backend[0])) {
        if (v[0] != null && frontend[k] == null) {
          v[0] = null;
          v[1] = override_new_version || (v[1] ?? -1) + 1;
          ret[0][k] = v;
        }
      }
      for (let [k, v] of Object.entries(frontend)) {
        if (!backend[0][k]) backend[0][k] = [null, -1];
        let changes = shelf.localUpdate(backend[0][k], v, override_new_version);
        if (changes) ret[0][k] = changes;
      }
      return Object.keys(ret[0]).length ? ret : null;
    }
  } else {
    backend[1] = override_new_version || (backend[1] ?? -1) + 1;
    if (isObj(frontend)) {
      backend[0] = {};
      for (let [k, v] of Object.entries(frontend)) {
        if (isObj(v)) {
          backend[0][k] = [null, -1];
          shelf.localUpdate(backend[0][k], v, override_new_version);
        } else {
          backend[0][k] = [v, 0];
        }
      }
    } else backend[0] = frontend;
    return backend;
  }
};

shelf.remoteUpdate = (a, f, b) => {
  if (b[1] > (a[1] ?? -1) || (b[1] == a[1] && greaterThan(b[0], a[0]))) {
    a[1] = b[1];
    if (!isObj(a[0]) && isObj(f) && isObj(b[0])) {
      a[0] = {};
      return shelf.remoteUpdate(a, f, b);
    }
    if (isObj(b[0])) {
      a[0] = {};
      shelf.merge(a, b);
    } else a[0] = b[0];
    f = shelf.read(a);
  } else if (b[1] == a[1] && isObj(a[0]) && isObj(b[0])) {
    if (isObj(f)) {
      for (let [k, v] of Object.entries(b[0])) {
        if (!a[0][k]) a[0][k] = [null, -1];
        f[k] = shelf.remoteUpdate(a[0][k], f[k], v);
        if (f[k] == null) delete f[k];
      }
    } else shelf.merge(a, b);
  }
  return f;
};

function isObj(o) {
  return o && typeof o == "object" && !Array.isArray(o);
}

function greaterThan(a, b) {
  if (isObj(b)) return false;
  if (isObj(a)) return true;
  return JSON.stringify(a) > JSON.stringify(b);
}

function equal(a, b) {
  if (isObj(a)) return isObj(b);
  if (isObj(b)) return false;
  return JSON.stringify(a) == JSON.stringify(b);
}
