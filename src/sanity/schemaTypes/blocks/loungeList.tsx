import { ListIcon } from '@sanity/icons/List';
import { Card, Flex, Stack, Text } from '@sanity/ui';
import { defineField, defineType, ObjectInputProps } from 'sanity';

// Help text above the editable fields. The Lounge items themselves are
// auto-listed (nothing to configure), but the "In Partner With" marquee below
// is editable, so we render the default field form underneath the note.
function LoungeListInput(props: ObjectInputProps) {
  return (
    <Stack space={4}>
      <Card padding={4} radius={2} tone='transparent' border>
        <Flex align='flex-start' gap={3}>
          <Text size={3} muted>
            <ListIcon />
          </Text>
          <Stack space={3}>
            <Text size={1} weight='semibold'>
              Lounge List
            </Text>
            <Text size={1} muted>
              Automatically shows all Lounge items, newest first — manage items
              under Content → Lounge. Use the &ldquo;In Partner With&rdquo; field
              below to configure the looping partner marquee.
            </Text>
          </Stack>
        </Flex>
      </Card>
      {props.renderDefault(props)}
    </Stack>
  );
}

export const loungeList = defineType({
  name: 'loungeList',
  title: 'Lounge List',
  type: 'object',
  icon: ListIcon,
  components: {
    input: LoungeListInput,
  },
  fields: [
    defineField({
      name: 'inPartnerWith',
      title: 'In Partner With',
      type: 'inPartnerWith',
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Lounge List',
        subtitle: 'Shows all Lounge items (newest first)',
        media: ListIcon,
      };
    },
  },
});
