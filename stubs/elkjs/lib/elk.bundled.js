export const ELK_UNSUPPORTED =
  "The ELK layout is not supported: elkjs is EPL-2.0, which Docleus does not ship. Remove `layout: elk` to use the default layout.";

export default class ELK {
  constructor() {
    throw new Error(ELK_UNSUPPORTED);
  }
}
