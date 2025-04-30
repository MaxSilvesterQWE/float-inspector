"use strict"

function range(min, max, step) {
  if (step == null && max == null) {
    max = min
    min = 0
  }
  if (step == null)
    step = 1
  const l = []
  for (let i = min; i != max; i += step)
    l.push(i)
  return l
}

function group(array, size) {
  const l = []
  for (let i = 0; i < array.length; i++)
    l.push(array.slice(i,i+size))
}

function leftpad(s,n,c) {
  while (s.length < n)
    s = `${c}${s}`
  return s
}

const set_float_versions = {
  16: DataView.prototype.setFloat16,
  32: DataView.prototype.setFloat32,
  64: DataView.prototype.setFloat64
}
const get_float_versions = {
  16: DataView.prototype.getFloat16,
  32: DataView.prototype.getFloat32,
  64: DataView.prototype.getFloat64
}

function init(bits) {
  const sign_size = 1
  const exponent_size = {16: 5, 32: 8, 64: 11}[bits]
  const mantissa_size = bits-exponent_size-sign_size
  const set_float = set_float_versions[bits]
  const get_float = get_float_versions[bits]

  const sign_element = document.querySelector(`#f${bits}-s0`)
  const exponent_elements = range(exponent_size).map(i => document.querySelector(`#f${bits}-e${i}`))
  const mantissa_elements = range(mantissa_size).map(i => document.querySelector(`#f${bits}-m${i}`))
  const elements = [sign_element].concat(exponent_elements, mantissa_elements)

  const sign_value_element = document.querySelector(`#f${bits}-s-val`)
  const exponent_value_element = document.querySelector(`#f${bits}-e-val`)
  const mantissa_value_element = document.querySelector(`#f${bits}-m-val`)

  const sign_encoded_element = document.querySelector(`#f${bits}-s-enc`)
  const exponent_encoded_element = document.querySelector(`#f${bits}-e-enc`)
  const mantissa_encoded_element = document.querySelector(`#f${bits}-m-enc`)

  const decimal_element = document.querySelector(`#f${bits}-dec`)
  const binary_element = document.querySelector(`#f${bits}-bin`)
  const hexadecimal_element = document.querySelector(`#f${bits}-hex`)

  for (const e of elements)
    e.onchange = recompute_from_checkboxes

  decimal_element.onchange = recompute_from_dec
  binary_element.onchange = recompute_from_bin
  hexadecimal_element.onchange = recompute_from_hex

  function big_to_float(big) {
    const buf = new ArrayBuffer(8)
    const dv = new DataView(buf)
    dv.setBigUint64(0, big, true)
    const f = get_float.call(dv, 0, true)
    return f
  }

  function float_to_big(float) {
    const buf = new ArrayBuffer(8)
    const dv = new DataView(buf)
    dv.setBigUint64(0, 0n, true)
    set_float.call(dv, 0, float, true)
    const big = dv.getBigUint64(0, true)
    return big
  }

  function from_sem(sign, exponent, mantissa) {
    sign = BigInt(sign)
    exponent = BigInt(exponent)
    mantissa = BigInt(mantissa)
    const big = sign << BigInt(exponent_size+mantissa_size) | exponent << BigInt(mantissa_size) | mantissa
    const float = big_to_float(big)
    return {sign, exponent, mantissa, big, float}
  }

  function from_big(big) {
    big = BigInt(big)
    const sign = (big >> BigInt(exponent_size+mantissa_size)) & 1n
    const exponent = (big >> BigInt(mantissa_size)) & ((1n << BigInt(exponent_size)) - 1n)
    const mantissa = (big) & ((1n << BigInt(mantissa_size)) - 1n)
    const float = big_to_float(big)
    return {sign, exponent, mantissa, big, float}
  }

  function from_float(float) {
    return from_big(float_to_big(float))
  }

  function recompute_from_checkboxes() {
    let sign = BigInt(+sign_element.checked)
    let exponent = exponent_elements.map((e,i) =>  BigInt(+e.checked) << BigInt(i)).reduce((a,b) => a|b, BigInt(0))
    let mantissa = mantissa_elements.map((e,i) => BigInt(+e.checked) << BigInt(i)).reduce((a,b) => a|b, BigInt(0))

    render(from_sem(sign, exponent, mantissa))
  }

  function recompute_from_dec() {
    const t = decimal_element.value
    const f = Number.parseFloat(t)

    render(from_float(f))
  }

  function recompute_from_bin() {
    const t = binary_element.value
    const b = BigInt(`0b${t}`)

    render(from_big(b))
  }

  function recompute_from_hex() {
    const t = hexadecimal_element.value
    const b = BigInt(`0x${t}`)

    render(from_big(b))
  }

  function render({sign, exponent, mantissa, big, float}) {
    sign_element.checked = sign
    exponent_elements.forEach((e,i) => e.checked = (exponent >> BigInt(i)) & 1n)
    mantissa_elements.forEach((e,i) => e.checked = (mantissa >> BigInt(i)) & 1n)

    sign_encoded_element.innerText = sign
    exponent_encoded_element.innerText = exponent
    mantissa_encoded_element.innerText = mantissa

    sign_value_element.innerText = sign == 0 ? "+1" : "-1"
    exponent_value_element.innerText = exponent - ((1n << BigInt(exponent_size-1)) - 1n)
    mantissa_value_element.innerText = 1+Number(mantissa)*Math.pow(2,-mantissa_size)

    decimal_element.value = 1 / float === -Infinity ? "-0" : float
    binary_element.value = leftpad(big.toString(2), bits, "0")
    hexadecimal_element.value = leftpad(big.toString(16), bits/4, "0")
  }

  render(from_big(0))
}

init(16)
init(32)
init(64)
