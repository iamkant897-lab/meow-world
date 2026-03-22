export default function Toast({ ico, msg }) {
  return (
    <div className="toast">
      <span>{ico}</span>
      <span>{msg}</span>
    </div>
  )
}
