/**
 * 读入外部 SVG 时给缺 id 的元素补 `标签名+序号`（rect1、rect2…），
 * 已经被占用的 id 跳过。一次读入过程里同一个标签的序号持续累加。
 */
export class IdAllocator {
  private readonly counters = new Map<string, number>();

  constructor(private readonly isTaken: (id: string) => boolean) {}

  allocate(kind: string): string {
    let counter = this.counters.get(kind) ?? 0;
    let candidate: string;
    do {
      counter += 1;
      candidate = `${kind}${counter}`;
    } while (this.isTaken(candidate));
    this.counters.set(kind, counter);
    return candidate;
  }
}
