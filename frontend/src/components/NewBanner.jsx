export default function NewBanner({ count, onClick }) {
  return (
    <div className="new-banner" onClick={onClick}>
      🐱 새로운 사진 <strong>{count}</strong>장 도착! 클릭해서 보기 ↑
    </div>
  )
}
