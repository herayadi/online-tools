function double_sha256(input) {
  return sha256(sha256.arrayBuffer(input));
}
