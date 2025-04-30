"use strict"

function range(min, max, step) {
  if (step == null && max == null) {
    max = min
    min = 0
  }
  if (step == null)
    step = 1
  const l = []
  for (let i = min; i < max; i += step)
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

const sign_element = document.querySelector("#f32-s0")
const exponent_elements = range(8).map(i => document.querySelector(`#f32-e${i}`))
const mantissa_elements = range(23).map(i => document.querySelector(`#f32-m${i}`))
const elements = [sign_element].concat(exponent_elements, mantissa_elements)

const sign_value_element = document.querySelector("#f32-s-val")
const exponent_value_element = document.querySelector("#f32-e-val")
const mantissa_value_element = document.querySelector("#f32-m-val")

const sign_encoded_element = document.querySelector("#f32-s-enc")
const exponent_encoded_element = document.querySelector("#f32-e-enc")
const mantissa_encoded_element = document.querySelector("#f32-m-enc")

const decimal_element = document.querySelector("#f32-dec")
const binary_element = document.querySelector("#f32-bin")
const hexadecimal_element = document.querySelector("#f32-hex")

for (const e of elements)
  e.onchange = recompute_from_checkboxes

decimal_element.onchange = recompute_from_dec
binary_element.onchange = recompute_from_bin
hexadecimal_element.onchange = recompute_from_hex

function big_to_float(big) {
  const buf = new ArrayBuffer(8)
  const dv = new DataView(buf)
  dv.setBigUint64(0, big)
  const f = dv.getFloat32(4)
  return f
}

function float_to_big(float) {
  const buf = new ArrayBuffer(8)
  const dv = new DataView(buf)
  dv.setBigUint64(0, 0n)
  dv.setFloat32(4, float)
  const big = dv.getBigUint64(0)
  return big
}

function from_sem(sign, exponent, mantissa) {
  sign = BigInt(sign)
  exponent = BigInt(exponent)
  mantissa = BigInt(mantissa)
  const big = sign << 31n | exponent << 23n | mantissa
  const float = big_to_float(big)
  return {sign, exponent, mantissa, big, float}
}

function from_big(big) {
  big = BigInt(big)
  const sign = (big >> 31n) & 1n
  const exponent = (big >> 23n) & ((1n << 8n) - 1n)
  const mantissa = (big) & ((1n << 23n) - 1n)
  const float = big_to_float(big)
  return {sign, exponent, mantissa, big, float}
}

function from_float(float) {
  return from_big(float_to_big(float))
}

function recompute_from_checkboxes() {
  let sign = BigInt(+sign_element.checked)
  let exponent = BigInt(exponent_elements.map((e,i) => +e.checked << i).reduce((a,b) => a|b,0))
  let mantissa = BigInt(mantissa_elements.map((e,i) => +e.checked << i).reduce((a,b) => a|b,0))

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
  exponent_value_element.innerText = exponent - 127n
  mantissa_value_element.innerText = 1+Number(mantissa)*Math.pow(2,-23)

  decimal_element.value = 1 / float === -Infinity ? "-0" : float
  binary_element.value = leftpad(big.toString(2), 32, "0")
  hexadecimal_element.value = leftpad(big.toString(16), 8, "0")
}

render(from_big(0))
