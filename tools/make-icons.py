# Writes a flat green rounded-square PNG with a white clock ring; no PIL needed.
import struct, zlib, math, sys

def png(size, path):
    bg, fg = (11, 61, 46), (255, 255, 255)
    cx = cy = size / 2; r_out, r_in = size * 0.34, size * 0.27
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            d = math.hypot(x - cx, y - cy)
            ring = r_in <= d <= r_out
            hand = (abs(x - cx) < size * 0.035 and cy - size * 0.24 < y < cy) or (abs(y - cy) < size * 0.035 and cx < x < cx + size * 0.17)
            row += bytes(fg if ring or hand else bg)
        rows.append(bytes(row))
    raw = b''.join(rows)
    def chunk(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    open(path, 'wb').write(data)

for s in (192, 512): png(s, f'icon-{s}.png')
print('ok')
