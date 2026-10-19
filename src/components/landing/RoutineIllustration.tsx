type Scene = "chai" | "lunch" | "afternoon" | "dinner" | "walk";

export default function RoutineIllustration({ scene, alt }: { scene: Scene; alt: string }) {
  return (
    <svg className="story-art" viewBox="0 0 360 220" role="img" aria-label={alt}>
      <path d="M32 188 C96 182 248 194 328 186" fill="none" stroke="#B58777" strokeWidth="2" strokeLinecap="round" />
      {scene === "chai" && (
        <g fill="none" stroke="#661414" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M118 61 C108 48 126 43 116 28 M163 61 C153 48 171 43 161 28" stroke="#C04E2A" />
          <path d="M93 73 L107 151 Q139 165 171 151 L185 73 Z" fill="#F8F2EB" />
          <path d="M102 112 Q138 120 176 112 L171 150 Q139 161 111 150 Z" fill="#B58777" stroke="none" />
          <path d="M185 88 C221 80 222 132 178 126 M79 158 Q138 174 198 158" />
          <path d="M222 143 Q252 129 272 144 Q258 161 230 158 Z" fill="#F8F2EB" />
          <path d="M233 140 Q247 133 260 140" stroke="#C04E2A" />
          <circle cx="236" cy="85" r="16" fill="#E6CBBD" />
          <circle cx="272" cy="96" r="13" fill="#E6CBBD" />
          <path d="M229 83 Q236 78 243 83 M267 94 Q272 89 277 94" stroke="#C04E2A" />
        </g>
      )}
      {scene === "lunch" && (
        <g fill="none" stroke="#661414" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="180" cy="125" rx="112" ry="53" fill="#F8F2EB" />
          <ellipse cx="180" cy="125" rx="94" ry="39" stroke="#B58777" />
          <ellipse cx="135" cy="119" rx="37" ry="23" fill="#E6CBBD" />
          <path d="M106 121 Q135 91 164 121 Q137 145 106 121 Z" fill="#F5EBDF" />
          <path d="M193 105 Q224 89 241 106 L234 135 Q211 147 192 132 Z" fill="#F5EBDF" />
          <path d="M205 113 Q219 101 230 111 M207 124 Q221 112 232 122" stroke="#C04E2A" />
          <path d="M153 149 Q177 132 199 151 Q180 169 153 149 Z" fill="#B58777" />
          <path d="M171 146 Q175 136 181 132 M184 148 Q194 137 201 138" stroke="#C04E2A" />
        </g>
      )}
      {scene === "afternoon" && (
        <g fill="none" stroke="#661414" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M63 151 L292 151 M91 151 L91 178 M272 151 L272 178" />
          <path d="M92 145 L99 119 L178 119 L185 145 Z" fill="#F8F2EB" />
          <path d="M101 126 L176 126 M108 116 L108 107 L169 107 L169 116" stroke="#C04E2A" />
          <path d="M219 56 L253 56 L241 105 L211 105 Z M211 105 L258 105 L271 116 L201 116 Z" fill="#E6CBBD" />
          <path d="M233 116 L233 145" />
          <path d="M119 90 Q138 80 153 90 L149 105 L123 105 Z" fill="#B58777" />
          <path d="M123 89 L123 81 L150 81 L150 89" />
          <path d="M125 95 L147 95" stroke="#F8F2EB" />
        </g>
      )}
      {scene === "dinner" && (
        <g fill="none" stroke="#661414" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="176" cy="132" rx="111" ry="46" fill="#F8F2EB" />
          <ellipse cx="176" cy="132" rx="91" ry="32" stroke="#B58777" />
          <path d="M93 126 Q120 94 151 124 Q125 153 93 126 Z" fill="#E6CBBD" />
          <path d="M101 126 Q122 113 141 126 M110 134 Q125 120 143 131" stroke="#C04E2A" />
          <path d="M174 111 Q194 96 218 110 L213 141 Q192 153 172 140 Z" fill="#B58777" />
          <path d="M180 119 Q194 108 209 118 M182 130 Q197 119 210 130" stroke="#F8F2EB" />
          <path d="M232 130 Q258 111 278 130 Q259 148 232 130 Z" fill="#F5EBDF" />
          <path d="M244 130 Q251 117 260 119 M255 135 Q262 123 271 125" stroke="#C04E2A" />
        </g>
      )}
      {scene === "walk" && (
        <g fill="none" stroke="#661414" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M82 131 C103 125 111 94 116 78 L145 88 C146 113 159 124 187 134 Q197 139 188 152 Q144 161 94 154 Q77 151 82 131 Z" fill="#F8F2EB" />
          <path d="M116 78 L145 88 M119 104 L145 110 M112 111 L139 119 M94 151 Q139 159 188 149" stroke="#C04E2A" />
          <path d="M193 145 C216 139 225 109 231 93 L258 104 C259 128 273 139 300 149 Q310 154 301 166 Q258 175 207 168 Q190 165 193 145 Z" fill="#E6CBBD" />
          <path d="M231 93 L258 104 M234 119 L261 126 M227 126 L254 135 M205 165 Q254 174 301 163" stroke="#C04E2A" />
          <path d="M59 82 Q67 73 75 82 M284 65 Q292 56 300 65" stroke="#B58777" />
        </g>
      )}
    </svg>
  );
}