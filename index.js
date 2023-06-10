export const wrap = (s) =>
  isObj(s)
    ? Object.fromEntries(Object.entries(s).map(([k, v]) => [k, wrap(v)]))
    : [s];

export const create = (init) => {
  let x = [null, -1];
  if (init !== undefined) merge(x, wrap(init));
  return x;
};

export const read = (s, ...path) => {
  s = path.reduce((s, x) => s?.[0]?.[x], s);
  if (s && isObj(s[0])) {
    return Object.fromEntries(
      Object.entries(s[0])
        .map(([k, v]) => [k, read(v)])
        .filter(([k, v]) => v != null)
    );
  } else return s?.[0];
};

export const getChange = (a, b) => merge(a, b, false);

export const merge = (a, b, modify = true) => {
  let change = null;

  if (!a) a = [null, -1];
  if (!Array.isArray(b)) b = [b];

  let both_objs = isObj(a[0]) && isObj(b[0]);
  let eq = equal(a[0], b[0]);

  if (b[1] == null) b = [b[0], a[1] + (eq ? 0 : 1)];

  if (b[1] > (a[1] ?? -1) || (b[1] == a[1] && greaterThan(b[0], a[0]))) {
    if (isObj(b[0])) {
      if (modify) {
        a[0] = {};
        a[1] = b[1];
      }
      change = merge(modify ? a : [{}, b[1]], b, modify);
      if (!change) change = [{}, b[1]];
    } else {
      if (modify) {
        a[0] = b[0];
        a[1] = b[1];
      }
      change = b;
    }
  } else if (b[1] == a[1] && both_objs) {
    for (let [k, v] of Object.entries(b[0])) {
      if (modify && !a[0][k]) a[0][k] = [null, -1];
      let diff = merge(a[0][k], v, modify);
      if (diff) {
        if (!change) change = [{}, b[1]];
        change[0][k] = diff;
      }
    }
  }
  return change;
};

export const mask = (s, mask) => {
  return mask == true || !isObj(s[0])
    ? s
    : [
        Object.fromEntries(
          Object.entries(mask)
            .filter(([k, v]) => s[0][k])
            .map(([k, v]) => [k, mask(s[0][k], v)])
        ),
        s[1],
      ];
};

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
