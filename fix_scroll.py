import sys

with open('client/src/pages/ElectionsHub.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Remove the bad useEffect
bad_effect_start = text.find('  useEffect(() => {\n    const el = scrollRef.current;')
if bad_effect_start != -1:
    bad_effect_end = text.find('}, [electionType, selectedState]);', bad_effect_start) + len('}, [electionType, selectedState]);')
    text = text[:bad_effect_start] + text[bad_effect_end:]

# Remove drag state
bad_drag_state = """  // Drag to scroll state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);"""
text = text.replace(bad_drag_state, '')

# Replace the messy div with a simple one with onWheel
messy_div = """        <div 
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

clean_div = """        <div 
          className="hide-scroll" 
          style={{ overflowX: 'auto', overflowY: 'hidden', paddingBottom: '32px', paddingTop: '10px', minHeight: '60px' }}
          onWheel={(e) => {
            if (e.deltaY !== 0) {
               e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
        >"""
text = text.replace(messy_div, clean_div)

# Also remove scrollRef entirely
text = text.replace('  const scrollRef = React.useRef(null);\n', '')

with open('client/src/pages/ElectionsHub.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Cleaned up!")
