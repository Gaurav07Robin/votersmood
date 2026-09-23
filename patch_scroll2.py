import sys

with open('client/src/pages/ElectionsHub.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the previous useEffect wheel listener with a better one
old_effect = """  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      const onWheel = (e) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          el.scrollBy({ left: e.deltaY, behavior: 'auto' });
        }
      };
      el.addEventListener('wheel', onWheel, { passive: false });
      return () => el.removeEventListener('wheel', onWheel);
    }
  }, []);"""

new_effect = """  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [electionType, selectedState]); // Re-bind just in case DOM reconstructs
"""

if old_effect in text:
    text = text.replace(old_effect, new_effect)
else:
    print("Could not find old effect to replace.")

# Also add mouse drag to scroll for extra user-friendliness
drag_state = """  const [dropdownOpen, setDropdownOpen] = useState(false);
  const scrollRef = React.useRef(null);
  
  // Drag to scroll state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);
"""

if '  // Drag to scroll state' not in text:
    text = text.replace("  const [dropdownOpen, setDropdownOpen] = useState(false);\n  const scrollRef = React.useRef(null);", drag_state)

drag_handlers = """        <div 
          ref={scrollRef} 
          className="hide-scroll" 
          style={{ overflowX: 'auto', overflowY: 'hidden', paddingBottom: '32px', paddingTop: '10px', minHeight: '60px', cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={(e) => {
            setIsDragging(true);
            setStartX(e.pageX - scrollRef.current.offsetLeft);
            setScrollLeftPos(scrollRef.current.scrollLeft);
          }}
          onMouseLeave={() => setIsDragging(false)}
          onMouseUp={() => setIsDragging(false)}
          onMouseMove={(e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - scrollRef.current.offsetLeft;
            const walk = (x - startX) * 2; // scroll-fast
            scrollRef.current.scrollLeft = scrollLeftPos - walk;
          }}
        >"""

old_div = '<div ref={scrollRef} className="hide-scroll" style={{ overflowX: \'auto\', overflowY: \'hidden\', paddingBottom: \'32px\', paddingTop: \'10px\', minHeight: \'60px\' }}>'
if old_div in text:
    text = text.replace(old_div, drag_handlers)

with open('client/src/pages/ElectionsHub.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("done")
