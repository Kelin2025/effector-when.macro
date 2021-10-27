declare let when: (
  unit: Store<Boolean> | (() => boolean),
  callback: () => void
) => void;

export default when;
